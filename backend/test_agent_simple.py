"""Simple test for agent API"""
import asyncio
import os
from utils.config import config

# Set minimal env vars for testing
os.environ.setdefault('ENV_MODE', 'local')

async def test_config():
    print("=== Agent Configuration Test ===")
    print(f"MODEL_TO_USE: {config.MODEL_TO_USE}")
    print(f"OPENROUTER_API_KEY: {'Set' if config.OPENROUTER_API_KEY else 'Not set'}")
    print(f"OPENROUTER_API_BASE: {config.OPENROUTER_API_BASE}")
    
    # Test with direct API call
    if config.OPENROUTER_API_KEY:
        import httpx
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "anthropic/claude-3.5-sonnet",
            "messages": [{"role": "user", "content": "Say hello"}],
            "max_tokens": 10
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data, headers=headers)
                print(f"\nAPI Response Status: {response.status_code}")
                if response.status_code != 200:
                    print(f"Error: {response.text}")
                else:
                    print("Success!")
            except Exception as e:
                print(f"Error calling API: {e}")

if __name__ == "__main__":
    asyncio.run(test_config())