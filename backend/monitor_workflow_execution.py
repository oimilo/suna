#!/usr/bin/env python3
"""
Monitor workflow execution and check if it's using Pipedream integration
"""
import asyncio
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
import json
from pathlib import Path

# Try to load from multiple .env locations
env_locations = [
    Path(__file__).parent / '.env.local',
    Path(__file__).parent / '.env',
    Path(__file__).parent.parent / 'frontend' / '.env.local',
    Path(__file__).parent.parent / '.env'
]

for env_path in env_locations:
    if env_path.exists():
        load_dotenv(env_path)
        print(f"Loaded env from: {env_path}")
        break

# Get Supabase credentials
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials in environment")
    exit(1)

async def monitor_execution(agent_run_id: str):
    """Monitor the workflow execution status"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print(f"\n📊 Monitoring workflow execution: {agent_run_id}")
    print("=" * 60)
    
    # Check agent run status
    result = supabase.table('agent_runs').select('*').eq('id', agent_run_id).execute()
    
    if result.data:
        run = result.data[0]
        print(f"Status: {run['status']}")
        print(f"Created: {run['created_at']}")
        print(f"Completed: {run.get('completed_at', 'Not yet')}")
        
        if run.get('error'):
            print(f"❌ Error: {run['error']}")
        
        # Check for workflow execution details
        thread_id = run['thread_id']
        
        # Get messages from the thread to see workflow progress
        messages = supabase.table('messages').select('*').eq('thread_id', thread_id).order('created_at', desc=False).execute()
        
        print(f"\n📝 Workflow Progress ({len(messages.data)} messages):")
        print("-" * 60)
        
        for msg in messages.data:
            msg_type = msg['type']
            content = msg['content']
            created_at = msg['created_at']
            
            # Parse content if it's JSON
            if isinstance(content, str) and content.startswith('{'):
                try:
                    content = json.loads(content)
                except:
                    pass
            
            print(f"\n[{created_at}] Type: {msg_type}")
            
            if msg_type == 'workflow_status':
                if isinstance(content, dict):
                    if content.get('type') == 'step_start':
                        print(f"  🔄 Starting step {content.get('step_number')}: {content.get('step_name')}")
                    elif content.get('type') == 'step_complete':
                        print(f"  ✅ Completed step {content.get('step_number')}: {content.get('step_name')}")
                        if 'result' in content:
                            print(f"     Result: {json.dumps(content['result'], indent=2)}")
                    elif content.get('type') == 'step_error':
                        print(f"  ❌ Error in step {content.get('step_number')}: {content.get('error')}")
                    elif content.get('type') == 'workflow_complete':
                        print(f"  🎉 Workflow completed with status: {content.get('status')}")
                        if content.get('results'):
                            print(f"     Results: {json.dumps(content['results'], indent=2)}")
            elif msg_type == 'tool':
                if isinstance(content, dict):
                    tool_name = content.get('tool_name', 'unknown')
                    print(f"  🔧 Tool call: {tool_name}")
                    
                    # Check if it's a Pipedream tool
                    if 'pipedream' in tool_name.lower() or 'gmail' in tool_name.lower():
                        print(f"  ✨ PIPEDREAM INTEGRATION DETECTED!")
                        print(f"     Args: {json.dumps(content.get('args', {}), indent=2)}")
                        print(f"     Result: {json.dumps(content.get('result', {}), indent=2)}")
            elif msg_type == 'assistant':
                if isinstance(content, str):
                    # Truncate long messages
                    preview = content[:200] + '...' if len(content) > 200 else content
                    print(f"  💬 Assistant: {preview}")
        
        # Check if Pipedream was used
        print("\n" + "=" * 60)
        pipedream_used = False
        for msg in messages.data:
            if msg['type'] == 'tool' and isinstance(msg['content'], (dict, str)):
                content = msg['content']
                if isinstance(content, str):
                    try:
                        content = json.loads(content)
                    except:
                        pass
                if isinstance(content, dict):
                    tool_name = content.get('tool_name', '')
                    if 'pipedream' in tool_name.lower() or 'gmail' in tool_name.lower() or 'mcp_' in tool_name:
                        pipedream_used = True
                        break
        
        if pipedream_used:
            print("✅ Workflow IS using Pipedream integration for tools!")
        else:
            print("⚠️ Workflow is NOT using Pipedream integration - using simulated tools")
        
        return run['status']
    else:
        print(f"❌ Agent run {agent_run_id} not found")
        return None

async def main():
    # Use the most recent agent_run_id from the test
    agent_run_id = "9c123b6d-edd7-46c0-9e75-e3056db3ffdf"
    
    # Monitor the execution
    status = await monitor_execution(agent_run_id)
    
    # Keep checking if still running
    attempts = 0
    while status == 'running' and attempts < 30:
        print("\n⏳ Still running... waiting 2 seconds")
        await asyncio.sleep(2)
        status = await monitor_execution(agent_run_id)
        attempts += 1
    
    if status == 'completed':
        print("\n🎉 Workflow execution completed successfully!")
    elif status == 'failed':
        print("\n❌ Workflow execution failed")
    else:
        print(f"\n⏱️ Final status: {status}")

if __name__ == "__main__":
    asyncio.run(main())