#!/usr/bin/env python3
"""
Check agent configuration to see if it has Pipedream MCPs configured
"""
import asyncio
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment first
env_path = Path(__file__).parent / '.env.local'
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded env from: {env_path}")

# Set required env vars if missing
if not os.getenv('SUPABASE_URL'):
    os.environ['SUPABASE_URL'] = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '')
if not os.getenv('SUPABASE_ANON_KEY'):
    os.environ['SUPABASE_ANON_KEY'] = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

from services.supabase import DBConnection

async def check_agent_config():
    """Check agent configuration"""
    # First check the trigger to find the correct agent_id
    trigger_id = "6832c764-5eca-4b6c-8386-528c7d011ded"
    
    db = DBConnection()
    client = await db.client
    
    # Check trigger first
    trigger_result = await client.table('agent_triggers').select('*').eq('trigger_id', trigger_id).execute()
    if trigger_result.data:
        trigger = trigger_result.data[0]
        agent_id = trigger['agent_id']
        print(f"\n🔔 Trigger: {trigger['name']}")
        print(f"Agent ID: {agent_id}")
        print(f"Type: {trigger['trigger_type']}")
        print(f"Enabled: {trigger.get('enabled', False)}")
    else:
        print("❌ Trigger not found")
        return
    
    print(f"\n🔍 Checking agent configuration for: {agent_id}")
    print("=" * 60)
    
    # Check agent
    agent_result = await client.table('agents').select('*').eq('agent_id', agent_id).execute()
    if agent_result.data:
        agent = agent_result.data[0]
        print(f"Agent Name: {agent['name']}")
        print(f"Account ID: {agent['account_id']}")
    else:
        print("❌ Agent not found")
        return
    
    # Check active version
    version_result = await client.table('agent_versions').select('*').eq('agent_id', agent_id).eq('is_active', True).execute()
    
    if version_result.data:
        version = version_result.data[0]
        print(f"\n📋 Active Version: {version['version_number']}")
        print(f"Created: {version['created_at']}")
        
        # Get config field which contains the actual MCP configuration
        config = version.get('config', {})
        tools = config.get('tools', {})
        
        # Check configured MCPs from the proper location
        configured_mcps = tools.get('mcp', [])
        custom_mcps = tools.get('custom_mcp', [])
        
        print(f"\n🔌 Configured MCPs: {len(configured_mcps)}")
        for mcp in configured_mcps:
            print(f"  - {mcp.get('name', 'Unknown')}: {mcp.get('type', 'Unknown')}")
        
        print(f"\n🎨 Custom MCPs: {len(custom_mcps)}")
        for mcp in custom_mcps:
            mcp_type = mcp.get('customType', mcp.get('type', 'Unknown'))
            print(f"  - {mcp.get('name', 'Unknown')}: {mcp_type}")
            
            # Check if it's Pipedream
            if mcp_type == 'pipedream' or 'pipedream' in mcp.get('name', '').lower():
                print(f"    ✨ PIPEDREAM MCP FOUND!")
                print(f"    Config: {json.dumps(mcp.get('config', {}), indent=6)}")
                print(f"    Enabled Tools: {mcp.get('enabledTools', [])}")
        
        # Check agentpress tools from the correct location  
        agentpress_tools = tools.get('agentpress', {})
        print(f"\n🔧 Agentpress Tools:")
        for tool_name, tool_config in agentpress_tools.items():
            if isinstance(tool_config, dict) and tool_config.get('enabled'):
                print(f"  - {tool_name}: enabled")
            elif tool_config is True:
                print(f"  - {tool_name}: enabled")
    else:
        print("❌ No active version found")
    
    # Check workflow
    workflow_id = "637d1e96-03d3-4d57-b76b-41cd9591f206"
    workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).execute()
    
    if workflow_result.data:
        workflow = workflow_result.data[0]
        print(f"\n📝 Workflow: {workflow['name']}")
        print(f"Status: {workflow['status']}")
        
        steps = workflow.get('steps', [])
        print(f"Steps: {len(steps)}")
        
        for i, step in enumerate(steps):
            step_type = step.get('type', 'unknown')
            step_name = step.get('name', f'Step {i+1}')
            print(f"  {i+1}. {step_name} ({step_type})")
            
            if step_type == 'tool':
                config = step.get('config', {})
                tool_name = config.get('tool_name', 'unknown')
                print(f"     Tool: {tool_name}")
                
                if 'gmail' in tool_name.lower() or 'email' in tool_name.lower():
                    print(f"     ✉️ Email tool detected")

if __name__ == "__main__":
    asyncio.run(check_agent_config())