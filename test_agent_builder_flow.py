#!/usr/bin/env python3
"""
Teste do fluxo completo do Agent Builder
"""
import asyncio
import sys
from pathlib import Path

backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from agent.agent_builder_prompt import get_agent_builder_prompt

async def test_flow():
    print("=== Teste do Fluxo Agent Builder ===\n")
    
    # 1. Verificar o prompt
    print("1. Verificando prompt do Agent Builder:")
    prompt = get_agent_builder_prompt()
    print(f"   Tamanho do prompt: {len(prompt)} caracteres")
    print(f"   Primeiras palavras: {prompt[:200]}...")
    
    # 2. Verificar se menciona Agent Builder
    if "Agent Builder" in prompt:
        print("   ✓ Prompt menciona 'Agent Builder'")
    else:
        print("   ✗ Prompt NÃO menciona 'Agent Builder'")
    
    # 3. Verificar identidade
    print("\n2. Verificando identidade:")
    if "transform ideas into powerful, working AI agents" in prompt.lower():
        print("   ✓ Missão correta encontrada")
    else:
        print("   ✗ Missão não encontrada")
    
    # 4. Simular o que deveria acontecer
    print("\n3. Fluxo esperado:")
    print("   1. Frontend envia is_agent_builder=true")
    print("   2. Backend cria thread com metadata")
    print("   3. run_agent recebe is_agent_builder=true")
    print("   4. run.py usa get_agent_builder_prompt()")
    print("   5. Agente responde como Agent Builder")
    
    print("\n4. Possíveis problemas:")
    print("   - is_agent_builder não está chegando ao run.py")
    print("   - Metadata do thread não está sendo salvo")
    print("   - Alguma lógica está sobrescrevendo o prompt")
    print("   - O agente padrão está sendo usado incorretamente")

if __name__ == "__main__":
    asyncio.run(test_flow())