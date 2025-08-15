import asyncio
import json
import httpx
from typing import AsyncGenerator, Optional
from .utils import get_env_var

class OllamaClient:
    def __init__(self):
        self.host = get_env_var("OLLAMA_HOST", "http://localhost:11434")
        self.model = get_env_var("MODEL_NAME", "qwen2.5:14b")
        self.timeout = httpx.Timeout(30.0, connect=10.0)
    
    def set_model(self, model_name: str):
        """Set the current model to use."""
        self.model = model_name
    
    async def health_check(self) -> bool:
        """Check if Ollama is reachable and healthy."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.host}/api/tags")
                return response.status_code == 200
        except Exception:
            return False
    
    async def stream_generate(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        cancel_event: Optional[asyncio.Event] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream tokens from Ollama with cancellation support.
        
        Args:
            prompt: The input prompt for code generation
            model: Model to use (defaults to self.model)
            cancel_event: Event to check for cancellation
            
        Yields:
            Token strings as they arrive
        """
        if model is None:
            model = self.model
            
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_predict": 2048
            }
        }
        
        try:
            # Use a shorter timeout for individual requests to prevent blocking
            request_timeout = httpx.Timeout(60.0, connect=5.0, read=30.0, write=5.0)
            
            async with httpx.AsyncClient(timeout=request_timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.host}/api/generate",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        # Check for cancellation more frequently
                        if cancel_event and cancel_event.is_set():
                            break
                            
                        if not line.strip():
                            continue
                            
                        try:
                            data = json.loads(line)
                            
                            # Check for completion
                            if data.get("done", False):
                                break
                                
                            # Extract token
                            token = data.get("response", "")
                            if token:
                                yield token
                                
                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            # Log but continue processing
                            print(f"Error processing token: {e}")
                            continue
                            
        except httpx.TimeoutException:
            raise Exception("Ollama request timed out")
        except httpx.HTTPStatusError as e:
            raise Exception(f"Ollama HTTP error: {e.response.status_code}")
        except Exception as e:
            raise Exception(f"Ollama connection error: {str(e)}")
    
    async def generate_sync(self, prompt: str, model: Optional[str] = None) -> str:
        """
        Generate complete response synchronously (for testing).
        
        Args:
            prompt: The input prompt
            model: Model to use (defaults to self.model)
            
        Returns:
            Complete generated text
        """
        if model is None:
            model = self.model
            
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_predict": 2048
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.host}/api/generate",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                data = response.json()
                return data.get("response", "")
                
        except Exception as e:
            raise Exception(f"Ollama generation error: {str(e)}")

# Global instance
ollama_client = OllamaClient()
