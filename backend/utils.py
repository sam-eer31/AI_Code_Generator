import os
import re
import uuid
from datetime import datetime, timezone
from typing import Tuple, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_env_var(key: str, default: str = "") -> str:
    """Get environment variable with fallback to default."""
    return os.getenv(key, default)

def utcnow() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)

def generate_id() -> str:
    """Generate a unique ID for generations."""
    return str(uuid.uuid4())

def safe_filename(text: str, max_length: int = 50) -> str:
    """Create a safe filename from text."""
    # Extract first line or first code block
    lines = text.strip().split('\n')
    first_line = lines[0].strip()
    
    # Remove special characters and limit length
    safe_name = re.sub(r'[^\w\s-]', '', first_line)
    safe_name = re.sub(r'[-\s]+', '-', safe_name)
    safe_name = safe_name.strip('-')
    
    if len(safe_name) > max_length:
        safe_name = safe_name[:max_length].rstrip('-')
    
    return safe_name or "generated_code"

def guess_language_and_extension(text: str) -> Tuple[str, str]:
    """
    Guess programming language and file extension from text content.
    Returns (language_name, file_extension)
    """
    # Common language patterns
    patterns = {
        'python': (r'\b(import|from|def|class|if __name__|print|return|yield|async def)\b', '.py'),
        'javascript': (r'\b(function|const|let|var|console\.|export|import|=>)\b', '.js'),
        'typescript': (r'\b(interface|type|enum|namespace|declare|as|any|string|number|boolean)\b', '.ts'),
        'html': (r'<[^>]+>|<!DOCTYPE|html|head|body|div|span|p|a|img', '.html'),
        'css': (r'[.#][a-zA-Z][a-zA-Z0-9_-]*\s*{|@media|@keyframes|@import', '.css'),
        'java': (r'\b(public|private|class|interface|extends|implements|static|final)\b', '.java'),
        'cpp': (r'\b(#include|using namespace|std::|cout|cin|endl|vector|string)\b', '.cpp'),
        'c': (r'\b(#include|printf|scanf|malloc|free|struct|typedef)\b', '.c'),
        'rust': (r'\b(fn|let|mut|struct|enum|impl|trait|use|mod|pub)\b', '.rs'),
        'go': (r'\b(func|package|import|var|const|type|struct|interface|chan|go)\b', '.go'),
        'php': (r'\b(<?php|function|class|namespace|use|echo|print|return)\b', '.php'),
        'ruby': (r'\b(def|class|module|require|include|attr_accessor|puts)\b', '.rb'),
        'swift': (r'\b(func|class|struct|enum|var|let|import|guard|if let)\b', '.swift'),
        'kotlin': (r'\b(fun|class|object|val|var|when|data class|companion)\b', '.kt'),
        'scala': (r'\b(def|val|var|class|object|trait|case class|match)\b', '.scala'),
        'sql': (r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE)\b', '.sql'),
        'bash': (r'\b(#!/bin/bash|#!/bin/sh|echo|export|source|if|then|fi|for|do|done)\b', '.sh'),
        'powershell': (r'\b(Get-|Set-|New-|Remove-|Write-|$|foreach|if|else|function)\b', '.ps1'),
        'yaml': (r'^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:', '.yml'),
        'json': (r'^\s*[{"]', '.json'),
        'xml': (r'<\?xml|<[a-zA-Z][a-zA-Z0-9]*\s', '.xml'),
        'markdown': (r'^#\s|^##\s|^###\s|^-\s|^\*\s|^`{3}', '.md'),
    }
    
    # Check for code blocks first
    code_block_match = re.search(r'```(\w+)', text)
    if code_block_match:
        lang = code_block_match.group(1).lower()
        for pattern_lang, (_, ext) in patterns.items():
            if lang == pattern_lang:
                return pattern_lang, ext
        # If we found a code block but don't recognize the language, use the extension
        return lang, f'.{lang}'
    
    # Check content patterns
    for lang, (pattern, ext) in patterns.items():
        if re.search(pattern, text, re.IGNORECASE | re.MULTILINE):
            return lang, ext
    
    # Fallback based on common keywords
    text_lower = text.lower()
    if any(word in text_lower for word in ['function', 'var', 'console']):
        return 'javascript', '.js'
    elif any(word in text_lower for word in ['def', 'import', 'print']):
        return 'python', '.py'
    elif any(word in text_lower for word in ['<html', '<div', '<body']):
        return 'html', '.html'
    elif any(word in text_lower for word in ['{', '}', 'color:', 'background:']):
        return 'css', '.css'
    
    # Default fallback
    return 'text', '.txt'

def format_timestamp(dt: datetime) -> str:
    """Format datetime for display."""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text for display purposes."""
    if len(text) <= max_length:
        return text
    return text[:max_length].rstrip() + "..."

def get_title_from_content(content: str) -> str:
    """Extract a title from content for display in history."""
    lines = content.strip().split('\n')
    
    # Look for first non-empty line
    for line in lines:
        line = line.strip()
        if line and not line.startswith('#'):
            return truncate_text(line, 60)
    
    # Fallback to first line
    return truncate_text(lines[0] if lines else "Untitled", 60)
