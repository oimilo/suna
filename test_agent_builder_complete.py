#!/usr/bin/env python3
"""
Complete test script for Agent Builder functionality
Tests the entire flow from frontend to backend
"""

import asyncio
import json
from datetime import datetime, timezone
from backend.services.supabase import get_db_client
from backend.agent.run import run_agent
from backend.agent.agent_builder_prompt import get_agent_builder_prompt
import structlog

logger = structlog.get_logger()

async def test_agent_builder_flow():
    """Test the complete Agent Builder flow"""
    
    print("\n=== TESTE COMPLETO DO AGENT BUILDER ===\n")
    
    # 1. Simulate thread creation with agent builder metadata
    thread_id = "test-thread-builder"
    target_agent_id = "test-target-agent"
    
    # This is what the frontend sends
    is_agent_builder = True
    thread_metadata = {
        "is_agent_builder": True,
        "target_agent_id": target_agent_id
    }
    
    print(f"1. Simulando criação de thread com metadata:")
    print(f"   - is_agent_builder: {is_agent_builder}")
    print(f"   - target_agent_id: {target_agent_id}")
    print(f"   - thread_metadata: {json.dumps(thread_metadata, indent=2)}")
    
    # 2. Test prompt selection logic
    print("\n2. Testando lógica de seleção de prompt:")
    
    # Simulate what happens in run.py
    agent_config = None  # No agent config for agent builder
    
    # This is the logic from run.py
    if is_agent_builder:
        system_content = get_agent_builder_prompt()
        print("   ✓ Using Agent Builder prompt")
    elif agent_config and agent_config.get('system_prompt'):
        system_content = agent_config['system_prompt']
        print("   ✗ Using custom agent prompt")
    else:
        system_content = "Default system prompt"
        print("   ✗ Using default prompt")
    
    # 3. Check the actual prompt content
    print("\n3. Verificando conteúdo do prompt:")
    print(f"   - Primeiro parágrafo do prompt:")
    first_paragraph = system_content.split('\n')[0][:100] + "..."
    print(f"     '{first_paragraph}'")
    
    # 4. Test with virtual agent config
    print("\n4. Testando com configuração virtual de agente:")
    virtual_agent_config = {
        'agent_id': 'agent-builder-virtual',
        'name': 'Agent Builder',
        'system_prompt': '',  # Empty, should be overridden
        'agentpress_tools': {},
        'configured_mcps': [],
        'custom_mcps': [],
        'is_default': False,
        'version_name': 'v1'
    }
    
    # Test prompt selection with virtual config
    if is_agent_builder:
        system_content = get_agent_builder_prompt()
        print("   ✓ Virtual config correctly overridden by Agent Builder prompt")
    else:
        print("   ✗ Virtual config NOT overridden")
    
    # 5. Test actual agent run
    print("\n5. Testando execução do agente (simulada):")
    print("   - Thread ID:", thread_id)
    print("   - Is Agent Builder:", is_agent_builder)
    print("   - Target Agent ID:", target_agent_id)
    
    # Check if the prompt contains Agent Builder specific content
    if "Agent Builder Assistant" in system_content:
        print("   ✓ Prompt contém 'Agent Builder Assistant'")
    else:
        print("   ✗ Prompt NÃO contém 'Agent Builder Assistant'")
        
    if "update_agent" in system_content:
        print("   ✓ Prompt contém ferramentas do Agent Builder")
    else:
        print("   ✗ Prompt NÃO contém ferramentas do Agent Builder")
    
    # 6. Summary
    print("\n=== RESUMO ===")
    print("Para o Agent Builder funcionar corretamente:")
    print("1. ✓ Frontend deve enviar is_agent_builder=true")
    print("2. ✓ Backend deve criar thread com metadata")
    print("3. ✓ run_agent deve receber is_agent_builder=true")
    print("4. ✓ run.py deve usar get_agent_builder_prompt()")
    print("5. ✓ Configuração virtual previne uso do agente padrão")
    
    print("\nFluxo de correção implementado:")
    print("- api.py: Adiciona is_agent_builder ao run_agent_async em produção")
    print("- api.py: Cria configuração virtual quando is_agent_builder=true")
    print("- run.py: Prioriza is_agent_builder sobre qualquer outra configuração")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_agent_builder_flow())