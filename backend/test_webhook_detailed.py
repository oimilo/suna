#!/usr/bin/env python3
import asyncio
import httpx
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

async def test_webhook():
    trigger_id = "6832c764-5eca-4b6c-8386-528c7d011ded"
    workflow_id = "637d1e96-03d3-4d57-b76b-41cd9591f206"
    
    # Use the DigitalOcean API URL
    webhook_url = f"https://prophet-milo-f3hr5.ondigitalocean.app/api/triggers/{trigger_id}/webhook"
    
    payload = {
        "trigger_id": trigger_id,
        "agent_id": "b1e3c0e8-ca14-43d9-8524-0c8c12db93ee",
        "execution_type": "workflow",
        "workflow_id": workflow_id,
        "workflow_input": {
            "spreadsheet_url": "https://docs.google.com/spreadsheets/d/1pCjK_8hh-FeTwf01qe6RmQzGEWz7NIfSKgQXxJ5Rg5c/edit#gid=2062726619",
            "check_interval": "5 minutes"
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Trigger-Source": "test_script",
        "x-trigger-secret": os.getenv("TRIGGER_SECRET", "")
    }
    
    print(f"Testing webhook: {webhook_url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers=headers
            )
            
            print(f"\nStatus Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"\nResponse JSON:")
                print(json.dumps(response_data, indent=2))
                
                # Check for specific error
                if response_data.get('execution'):
                    exec_result = response_data['execution']
                    if not exec_result.get('success'):
                        print(f"\n⚠️ Execution failed: {exec_result.get('error')}")
                        print(f"Message: {exec_result.get('message')}")
                        
                        # This is where we see the bool error
                        if "'bool' object has no attribute 'get'" in str(exec_result.get('error', '')):
                            print("\n🔍 Found the bool error! This means something is returning a boolean instead of a dict.")
                            print("The error is likely in the workflow validation or model access check.")
                    else:
                        print(f"\n✅ Execution started successfully!")
                        print(f"Thread ID: {exec_result.get('thread_id')}")
                        print(f"Agent Run ID: {exec_result.get('agent_run_id')}")
                
            except json.JSONDecodeError:
                print(f"\nResponse Text: {response.text}")
                
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_webhook())