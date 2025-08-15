import asyncio
import json
import signal
import sys
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import httpx
import uvicorn

from .utils import (
    get_env_var, utcnow, generate_id, guess_language_and_extension,
    safe_filename, get_title_from_content
)
from .ollama_client import ollama_client

async def generate_filename(prompt: str, language: str) -> str:
    """Generate a descriptive filename using AI based on the user prompt."""
    try:
        # Create a simple prompt for filename generation
        filename_prompt = f"""Generate a short, descriptive filename (max 3 words) for code that does this: {prompt}
        
        Language: {language}
        
        Rules:
        - Use only lowercase letters, numbers, and underscores
        - Maximum 3 words
        - Be descriptive but concise
        - No file extension (just the name)
        
        Filename:"""
        
        # Use the same Ollama client to generate filename
        filename = ""
        async for token in ollama_client.stream_generate(filename_prompt):
            filename += token
            # Limit to reasonable length and stop at first newline
            if len(filename) > 50 or '\n' in filename:
                break
        
        # Clean up the filename
        filename = filename.strip().lower()
        filename = filename.replace(' ', '_')
        filename = ''.join(c for c in filename if c.isalnum() or c == '_')
        
        # Ensure it's not empty and has reasonable length
        if not filename or len(filename) < 2:
            filename = "generated_code"
        elif len(filename) > 30:
            filename = filename[:30]
        
        return filename
        
    except Exception as e:
        print(f"Error generating filename: {e}")
        # Fallback to safe filename
        return safe_filename(prompt[:20])

# Pydantic models
class GenerateRequest(BaseModel):
    prompt: str

class GenerationResponse(BaseModel):
    id: str

class HealthResponse(BaseModel):
    status: str
    mongodb: bool
    ollama: bool

# FastAPI app
app = FastAPI(
    title="Code Generator",
    description="AI-powered code generation with streaming support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongodb_uri = get_env_var("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongodb_uri)
db = client.codegen
generations_collection = db.generations

# Active generation tracking
active_generations: Dict[str, asyncio.Event] = {}

# Mount static files for frontend
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

@app.get("/")
async def root():
    """Redirect to frontend."""
    return FileResponse("frontend/index.html")

@app.get("/ready")
async def readiness_check():
    """Simple readiness check - just confirms the server is responding."""
    return {"status": "ready"}

# Health check cache and state
health_cache = {"last_check": 0, "cached_status": None, "cache_duration": 30}  # Cache for 30 seconds
active_generation_count = 0

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check system health with caching and generation-aware status."""
    global health_cache, active_generation_count
    
    current_time = asyncio.get_event_loop().time()
    
    # If we have active generations, return cached status or "busy" status
    if active_generation_count > 0:
        if health_cache["cached_status"] and (current_time - health_cache["last_check"]) < health_cache["cache_duration"]:
            # Return cached status during generation
            return health_cache["cached_status"]
        else:
            # Return "busy" status during generation to avoid interference
            return HealthResponse(
                status="busy",
                mongodb=True,  # Assume MongoDB is fine if we're generating
                ollama=True    # Assume Ollama is fine if we're generating
            )
    
    # Only do full health check if no active generations and cache is expired
    if not health_cache["cached_status"] or (current_time - health_cache["last_check"]) >= health_cache["cache_duration"]:
        # Check MongoDB (lightweight)
        mongodb_ok = False
        try:
            await db.command("ping")
            mongodb_ok = True
        except Exception:
            pass
        
        # Check Ollama (lightweight - just connection, not full model load)
        ollama_ok = False
        try:
            # Use a very short timeout for health check to avoid blocking
            async with httpx.AsyncClient(timeout=httpx.Timeout(3.0, connect=2.0)) as client:
                response = await client.get(f"{ollama_client.host}/api/tags")
                ollama_ok = response.status_code == 200
        except Exception:
            pass
        
        status = "ok" if mongodb_ok and ollama_ok else "degraded"
        
        health_cache["cached_status"] = HealthResponse(
            status=status,
            mongodb=mongodb_ok,
            ollama=ollama_ok
        )
        health_cache["last_check"] = current_time
    
    return health_cache["cached_status"]

@app.get("/models")
async def get_models():
    """Get available Ollama models."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            response = await client.get(f"{ollama_client.host}/api/tags")
            response.raise_for_status()
            data = response.json()
            
            models = []
            for model in data.get("models", []):
                models.append({
                    "name": model["name"],
                    "size": model.get("size", 0),
                    "modified_at": model.get("modified_at", "")
                })
            
            return {"models": models}
    except Exception as e:
        print(f"Error fetching models: {e}")
        return {"models": [], "error": str(e)}

class ModelRequest(BaseModel):
    model: str

@app.post("/models/set")
async def set_model(request: ModelRequest):
    """Set the current model to use."""
    try:
        # Verify the model exists
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            response = await client.get(f"{ollama_client.host}/api/tags")
            response.raise_for_status()
            data = response.json()
            
            available_models = [model["name"] for model in data.get("models", [])]
            
            if request.model not in available_models:
                raise HTTPException(status_code=400, detail=f"Model '{request.model}' not found")
        
        # Set the model
        ollama_client.set_model(request.model)
        
        return {"status": "success", "model": request.model}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting model: {e}")
        raise HTTPException(status_code=500, detail=f"Error setting model: {str(e)}")

@app.post("/generate", response_model=GenerationResponse)
async def create_generation(request: GenerateRequest):
    """Create a new generation entry."""
    global active_generation_count
    generation_id = generate_id()
    
    # Create initial document
    doc = {
        "_id": generation_id,
        "prompt": request.prompt,
        "model": ollama_client.model,
        "createdAt": utcnow(),
        "updatedAt": utcnow(),
        "status": "processing",
        "language": "unknown",
        "filename": "generated_code.txt",
        "output": "",
        "error": None
    }
    
    await generations_collection.insert_one(doc)
    
    return GenerationResponse(id=generation_id)

@app.get("/history")
async def get_history(limit: int = 50):
    """Get generation history."""
    cursor = generations_collection.find().sort("createdAt", -1).limit(limit)
    generations = []
    
    async for doc in cursor:
        # Convert ObjectId to string for JSON serialization
        doc["_id"] = str(doc["_id"])
        doc["createdAt"] = doc["createdAt"].isoformat()
        doc["updatedAt"] = doc["updatedAt"].isoformat()
        
        # Add title for display - use filename if available, otherwise use content
        if doc.get("filename") and doc.get("filename") != "generated_code.txt":
            # Use filename without extension as title
            filename_without_ext = doc["filename"].rsplit('.', 1)[0]
            doc["title"] = filename_without_ext
        else:
            doc["title"] = get_title_from_content(doc.get("output", doc.get("prompt", "")))
        
        generations.append(doc)
    
    return {"generations": generations}

@app.get("/history/{generation_id}")
async def get_generation(generation_id: str):
    """Get a specific generation."""
    doc = await generations_collection.find_one({"_id": generation_id})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    # Convert ObjectId to string for JSON serialization
    doc["_id"] = str(doc["_id"])
    doc["createdAt"] = doc["createdAt"].isoformat()
    doc["updatedAt"] = doc["updatedAt"].isoformat()
    
    return doc

@app.post("/stop/{generation_id}")
async def stop_generation(generation_id: str, request: Request):
    """Stop an active generation."""
    global active_generation_count
    
    # Set cancel event if generation is active
    if generation_id in active_generations:
        active_generations[generation_id].set()
        del active_generations[generation_id]
        # Decrement active generation counter
        active_generation_count = max(0, active_generation_count - 1)
    
    # Get output from request body
    output = ""
    try:
        # Try to get JSON body first
        body = await request.json()
        output = body.get("output", "")
    except:
        try:
            # Try to get form data (for sendBeacon)
            form_data = await request.form()
            output = form_data.get("output", "")
        except:
            # Try to get raw body as text
            try:
                body_text = await request.body()
                if body_text:
                    # Try to parse as JSON
                    import json
                    body = json.loads(body_text.decode())
                    output = body.get("output", "")
            except:
                output = ""
    
    # Update status and output in database
    update_data = {
        "status": "stopped",
        "updatedAt": utcnow()
    }
    
    # If output is provided, save it
    if output:
        update_data["output"] = output
        # Determine language and filename for stopped generation
        language, extension = guess_language_and_extension(output)
        update_data["language"] = language
        if language != "unknown":
            update_data["filename"] = f"stopped_generation{extension}"
    
    await generations_collection.update_one(
        {"_id": generation_id},
        {"$set": update_data}
    )
    
    return {"status": "stopped"}

@app.delete("/history/{generation_id}")
async def delete_generation(generation_id: str):
    """Delete a generation from history."""
    try:
        # Check if generation exists
        doc = await generations_collection.find_one({"_id": generation_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        # Delete the generation
        result = await generations_collection.delete_one({"_id": generation_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        # Remove from active generations if it was active
        if generation_id in active_generations:
            del active_generations[generation_id]
        
        return {"status": "deleted", "message": "Generation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting generation {generation_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

class FailRequest(BaseModel):
    error: str
    output: str = ""

@app.post("/history/{generation_id}/fail")
async def fail_generation(generation_id: str, request: FailRequest):
    """Mark a generation as failed."""
    global active_generation_count
    
    try:
        # Check if generation exists
        doc = await generations_collection.find_one({"_id": generation_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        # Remove from active generations if it was active
        if generation_id in active_generations:
            del active_generations[generation_id]
            # Decrement active generation counter
            active_generation_count = max(0, active_generation_count - 1)
        
        # Determine language and filename for failed generation
        language, extension = guess_language_and_extension(request.output)
        
        # Update status and output in database
        update_data = {
            "status": "failed",
            "error": request.error,
            "updatedAt": utcnow()
        }
        
        # If output is provided, save it
        if request.output:
            update_data["output"] = request.output
            update_data["language"] = language
            if language != "unknown":
                update_data["filename"] = f"failed_generation{extension}"
        
        await generations_collection.update_one(
            {"_id": generation_id},
            {"$set": update_data}
        )
        
        return {"status": "failed", "message": "Generation marked as failed"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error failing generation {generation_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.websocket("/ws/generate/{generation_id}")
async def websocket_generate(websocket: WebSocket, generation_id: str):
    """WebSocket endpoint for streaming code generation."""
    global active_generation_count
    
    try:
        await websocket.accept()
        # Increment active generation counter
        active_generation_count += 1
    except Exception as e:
        print(f"Failed to accept WebSocket connection: {e}")
        return
    
    # Get generation document
    doc = await generations_collection.find_one({"_id": generation_id})
    if not doc:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": "Generation not found"
        }))
        await websocket.close()
        return
    
    # Create cancel event
    cancel_event = asyncio.Event()
    active_generations[generation_id] = cancel_event
    
    try:
        # Send initial status
        try:
            await websocket.send_text(json.dumps({
                "type": "status",
                "status": "processing"
            }))
        except Exception:
            # WebSocket might be closed, ignore
            return
        
        # Stream generation
        full_output = ""
        token_count = 0
        
        # Modify prompt to request code-only output
        code_prompt = f"""You are a code generator. Output ONLY executable code. with markdown, no headers, no explanations, no comments outside code, no text before or after code. Just pure code starting immediately.

Request: {doc["prompt"]}

Code:"""
        
        async for token in ollama_client.stream_generate(
            code_prompt, 
            cancel_event=cancel_event
        ):
            # Check if client disconnected
            try:
                if websocket.client_state.value < 3:  # WebSocket is not closed
                    # Use asyncio.wait_for to prevent blocking
                    await asyncio.wait_for(
                        websocket.send_text(json.dumps({
                            "type": "token",
                            "data": token
                        })),
                        timeout=5.0
                    )
                    
                    full_output += token
                    token_count += 1
                    
                    # Send progress updates every 10 tokens
                    if token_count % 10 == 0:
                        await asyncio.wait_for(
                            websocket.send_text(json.dumps({
                                "type": "progress",
                                "tokens": token_count
                            })),
                            timeout=5.0
                        )
                else:
                    # WebSocket is closed, break the loop
                    break
                    
            except asyncio.TimeoutError:
                print(f"WebSocket send timeout for generation {generation_id}")
                break
            except Exception as e:
                print(f"WebSocket send error for generation {generation_id}: {e}")
                # Client disconnected
                break
        
        # Check if generation was cancelled
        if cancel_event.is_set():
            try:
                if websocket.client_state.value < 3:  # WebSocket is not closed
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "status": "stopped"
                    }))
            except Exception:
                # WebSocket might be closed, ignore
                pass
            # Don't update database here - the stop endpoint already handles it
            return
        
        # Determine language and filename
        language, extension = guess_language_and_extension(full_output)
        
        # Generate filename using AI based on user prompt
        filename = await generate_filename(doc["prompt"], language) + extension
        
        # Update database with completed generation
        await generations_collection.update_one(
            {"_id": generation_id},
            {
                "$set": {
                    "status": "completed",
                    "output": full_output,
                    "language": language,
                    "filename": filename,
                    "updatedAt": utcnow()
                }
            }
        )
        
        # Send completion message
        try:
            if websocket.client_state.value < 3:  # WebSocket is not closed
                await websocket.send_text(json.dumps({
                    "type": "done",
                    "language": language,
                    "filename": filename,
                    "token_count": token_count
                }))
        except Exception:
            # WebSocket might be closed, ignore
            pass
        
    except Exception as e:
        # Check if generation was stopped before setting failed status
        current_doc = await generations_collection.find_one({"_id": generation_id})
        if current_doc and current_doc.get("status") == "stopped":
            # Generation was already stopped, don't override the status
            return
        
        # Update database with error
        await generations_collection.update_one(
            {"_id": generation_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e),
                    "updatedAt": utcnow()
                }
            }
        )
        
        # Send error message
        try:
            if websocket.client_state.value < 3:  # WebSocket is not closed
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
        except Exception:
            # WebSocket might be closed, ignore
            pass
        
    finally:
        # Clean up
        if generation_id in active_generations:
            del active_generations[generation_id]
        
        # Decrement active generation counter
        active_generation_count = max(0, active_generation_count - 1)
        
        # Only close WebSocket if it's still open
        try:
            if websocket.client_state.value < 3:  # WebSocket is not closed
                await websocket.close()
        except Exception:
            # WebSocket might already be closed, ignore
            pass

@app.on_event("startup")
async def startup_event():
    """Initialize database connection."""
    try:
        await db.command("ping")
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
    
    # Check Ollama
    if await ollama_client.health_check():
        print("✅ Ollama is reachable")
    else:
        print("❌ Ollama is not reachable")
    
    # Set up signal handlers for graceful shutdown
    def signal_handler(signum, frame):
        print(f"\n🛑 Received signal {signum}, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    try:
        # Cancel all active generations
        for generation_id in list(active_generations.keys()):
            if generation_id in active_generations:
                active_generations[generation_id].set()
                del active_generations[generation_id]
        
        # Close MongoDB connection
        client.close()
        print("🔌 Disconnected from MongoDB")
    except Exception as e:
        print(f"Error during shutdown: {e}")
