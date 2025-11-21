#!/usr/bin/env python3
"""
Script para testar a funcionalidade list_available_tools
"""
import asyncio
import sys
from pathlib import Path

# Adiciona o backend ao path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

async def test_list_available_tools():
    """Testa a ferramenta list_available_tools"""
    
    # Importações necessárias
    from services.supabase import DBConnection
    from agentpress.thread_manager import ThreadManager
    from agent.tools.agent_builder_tools.workflow_tool import WorkflowTool
    
    print("🔧 Testando list_available_tools...")
    print("-" * 50)
    
    # Configuração de teste
    TEST_AGENT_ID = "00000000-0000-0000-0000-000000000001"  # Prophet default agent
    
    # Inicializa conexão com DB
    db = DBConnection()
    
    # Cria thread manager mock
    thread_manager = ThreadManager()
    
    # Inicializa WorkflowTool
    workflow_tool = WorkflowTool(
        thread_manager=thread_manager,
        db_connection=db,
        agent_id=TEST_AGENT_ID
    )
    
    try:
        # Teste 1: Listar ferramentas sem descrições
        print("\n📋 Teste 1: Listando ferramentas (sem descrições)")
        result = await workflow_tool.list_available_tools(include_descriptions=False)
        
        if result.success:
            import json
            data = json.loads(result.output)
            print(f"✅ Total de ferramentas encontradas: {data['total_tools']}")
            print(f"\n📦 Ferramentas por categoria:")
            for category, tools in data['categorized'].items():
                if tools:
                    print(f"  - {category}: {len(tools)} ferramentas")
                    # Mostra até 3 exemplos
                    for tool in tools[:3]:
                        print(f"    • {tool}")
                    if len(tools) > 3:
                        print(f"    ... e mais {len(tools) - 3}")
        else:
            print(f"❌ Erro: {result.output}")
            
        print("\n" + "-" * 50)
        
        # Teste 2: Listar ferramentas com descrições
        print("\n📋 Teste 2: Listando ferramentas (com descrições)")
        result = await workflow_tool.list_available_tools(include_descriptions=True)
        
        if result.success:
            import json
            data = json.loads(result.output)
            print(f"✅ Total de ferramentas: {data['total_tools']}")
            
            # Mostra algumas ferramentas com descrições
            print(f"\n📝 Exemplos de ferramentas com descrições:")
            all_tools = data.get('all_tools', [])
            for i, tool in enumerate(all_tools[:5]):
                if isinstance(tool, dict):
                    print(f"  {i+1}. {tool['name']}")
                    if tool.get('description'):
                        print(f"     → {tool['description'][:100]}...")
                else:
                    print(f"  {i+1}. {tool}")
        else:
            print(f"❌ Erro: {result.output}")
            
        print("\n" + "-" * 50)
        
        # Teste 3: Verificar se ferramentas MCP estão incluídas
        print("\n🔌 Teste 3: Verificando ferramentas MCP")
        result = await workflow_tool.list_available_tools(include_descriptions=False)
        
        if result.success:
            import json
            data = json.loads(result.output)
            mcp_tools = data['categorized'].get('mcp_integrations', [])
            
            if mcp_tools:
                print(f"✅ Encontradas {len(mcp_tools)} ferramentas MCP:")
                for tool in mcp_tools[:10]:
                    print(f"  • {tool}")
                if len(mcp_tools) > 10:
                    print(f"  ... e mais {len(mcp_tools) - 10}")
            else:
                print("⚠️  Nenhuma ferramenta MCP encontrada (pode ser normal se não há MCPs configurados)")
                
        print("\n" + "-" * 50)
        
        # Teste 4: Verificar a dica sobre nomes exatos
        print("\n💡 Teste 4: Verificando mensagens de ajuda")
        result = await workflow_tool.list_available_tools(include_descriptions=False)
        
        if result.success:
            import json
            data = json.loads(result.output)
            
            if 'tip' in data:
                print(f"✅ Dica incluída: {data['tip']}")
            if 'note' in data:
                print(f"✅ Nota incluída: {data['note']}")
                
        print("\n" + "=" * 50)
        print("✅ Testes concluídos!")
        
    except Exception as e:
        print(f"\n❌ Erro durante os testes: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Fecha conexão com DB
        if hasattr(db, 'close'):
            await db.close()

if __name__ == "__main__":
    print("🚀 Iniciando testes de list_available_tools")
    print("=" * 50)
    asyncio.run(test_list_available_tools())