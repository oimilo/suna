#!/usr/bin/env python3
"""Test LLM configuration and API keys"""

import os
import sys
sys.path.append('backend')

from utils.config import config
from services.llm import call_llm_completion

def test_llm_config():
    print("=== LLM Configuration Test ===\n")
    
    # Check environment variables
    print("1. Environment Variables:")
    print(f"   MODEL_TO_USE: {config.MODEL_TO_USE}")
    print(f"   OPENROUTER_API_KEY: {'Set' if config.OPENROUTER_API_KEY else 'Not set'}")
    print(f"   ANTHROPIC_API_KEY: {'Set' if config.ANTHROPIC_API_KEY else 'Not set'}")
    print(f"   OPENAI_API_KEY: {'Set' if config.OPENAI_API_KEY else 'Not set'}")
    print()
    
    # Test LLM call
    print("2. Testing LLM Call:")
    try:
        response = call_llm_completion(
            messages=[{"role": "user", "content": "Say 'Hello, I'm working!' in 5 words or less."}],
            model=config.MODEL_TO_USE or "anthropic/claude-3.5-sonnet",
            temperature=0.7,
            max_tokens=50
        )
        print(f"   Success! Response: {response}")
    except Exception as e:
        print(f"   Error: {type(e).__name__}: {str(e)}")
    
    print("\n3. Model Configuration:")
    print(f"   Default model: {config.MODEL_TO_USE}")
    
    # Check if OpenRouter is configured
    if config.MODEL_TO_USE and config.MODEL_TO_USE.startswith("openrouter/"):
        print(f"   Using OpenRouter: Yes")
        print(f"   OpenRouter API Base: {config.OPENROUTER_API_BASE}")
    else:
        print(f"   Using OpenRouter: No")

if __name__ == "__main__":
    test_llm_config()