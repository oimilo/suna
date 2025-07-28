"""Test OpenRouter API directly"""
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_openrouter():
    api_key = os.getenv("OPENROUTER_API_KEY", "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")
    
    print(f"Testing OpenRouter API...")
    print(f"API Key: {api_key[:20]}...")
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://prophet-milo.vercel.app",
        "X-Title": "Suna AI"
    }
    
    # Test different model names
    models_to_test = [
        "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3.5-sonnet-20241022",
        "openrouter/anthropic/claude-3.5-sonnet"
    ]
    
    for model in models_to_test:
        print(f"\nTesting model: {model}")
        data = {
            "model": model,
            "messages": [{"role": "user", "content": "Say 'Hello, I'm working!' in exactly 5 words."}],
            "max_tokens": 50,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=data, headers=headers)
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                    print(f"Success! Response: {content}")
                else:
                    print(f"Error: {response.text}")
                    
            except Exception as e:
                print(f"Exception: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_openrouter())