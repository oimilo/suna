#!/usr/bin/env python3
"""
Query direto ao Supabase via MCP para analisar execução específica
"""

import asyncio
from supabase import create_async_client

# Configurações de produção
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

EXECUTION_ID = "0cedd4c7-fc61-43d4-9a3b-d83761dff50a"

async def query_execution():
    try:
        print("🔍 Conectando ao Supabase via MCP...")
        client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # 1. Buscar detalhes completos da execução
        print(f"📊 Analisando execução: {EXECUTION_ID}")
        
        execution_result = await client.table('agent_runs').select('*').eq('id', EXECUTION_ID).execute()
        
        if execution_result.data:
            execution = execution_result.data[0]
            print(f"\n✅ EXECUÇÃO ENCONTRADA:")
            print(f"   ID: {execution['id']}")
            print(f"   Thread ID: {execution['thread_id']}")
            print(f"   Status: {execution['status']}")
            print(f"   Iniciado: {execution.get('started_at')}")
            print(f"   Concluído: {execution.get('completed_at')}")
            
            if execution.get('error'):
                print(f"   ❌ Erro: {execution['error']}")
            else:
                print(f"   ✅ Sem erros reportados")
                
            # 2. Buscar mensagens da thread desta execução
            thread_id = execution['thread_id']
            print(f"\n💬 MENSAGENS DA THREAD {thread_id}:")
            
            messages_result = await client.table('messages').select('*').eq('thread_id', thread_id).order('created_at', desc=True).limit(10).execute()
            
            if messages_result.data:
                for i, msg in enumerate(messages_result.data, 1):
                    role_emoji = "👤" if msg.get('type') == 'user' else "🤖"
                    content = msg.get('content', '')
                    timestamp = msg.get('created_at', 'N/A')[:19]
                    
                    print(f"\n   {i}. {role_emoji} {timestamp}")
                    
                    # Se for mensagem do assistant, mostrar conteúdo estruturado
                    if msg.get('type') == 'assistant':
                        if isinstance(content, dict):
                            print(f"      Tipo: {content.get('type', 'N/A')}")
                            if content.get('content'):
                                preview = content['content'][:200] + "..." if len(content['content']) > 200 else content['content']
                                print(f"      Conteúdo: {preview}")
                            if content.get('tool_calls'):
                                print(f"      Tool Calls: {len(content.get('tool_calls', []))} ferramentas")
                                for tool in content.get('tool_calls', []):
                                    print(f"        - {tool.get('function', {}).get('name', 'N/A')}")
                        elif isinstance(content, str):
                            preview = content[:200] + "..." if len(content) > 200 else content
                            print(f"      Conteúdo: {preview}")
                    else:
                        preview = content[:200] + "..." if len(content) > 200 else content
                        print(f"      Conteúdo: {preview}")
            else:
                print("   ❌ Nenhuma mensagem encontrada")
                
            # 3. Buscar configuração do agent usado
            print(f"\n🤖 CONFIGURAÇÃO DO AGENT:")
            
            # Primeiro tentar encontrar o projeto da thread
            try:
                thread_result = await client.table('threads').select('project_id, account_id').eq('thread_id', thread_id).execute()
                if thread_result.data:
                    thread_data = thread_result.data[0]
                    project_id = thread_data['project_id']
                    account_id = thread_data['account_id']
                    
                    print(f"   Project ID: {project_id}")
                    print(f"   Account ID: {account_id}")
                    
                    # Buscar projeto
                    project_result = await client.table('projects').select('*').eq('project_id', project_id).execute()
                    if project_result.data:
                        project = project_result.data[0]
                        print(f"   Projeto: {project.get('name', 'N/A')}")
                        
                        # Buscar configuração específica do agent para este projeto/thread
                        # Pode estar em uma tabela de configurações de agents
                        
            except Exception as config_error:
                print(f"   ⚠️  Erro ao buscar configuração: {config_error}")
                
            # 4. Buscar automação relacionada
            print(f"\n🔄 AUTOMAÇÃO RELACIONADA:")
            
            automation_result = await client.table('agent_triggers').select('*').eq('trigger_id', '7163752f-d41e-472a-9fe9-e38b102012bb').execute()
            if automation_result.data:
                automation = automation_result.data[0]
                print(f"   Nome: {automation.get('name')}")
                print(f"   Tipo: {automation.get('trigger_type')}")
                print(f"   Ativo: {automation.get('is_active')}")
                
                config = automation.get('config', {})
                workflow_id = config.get('workflow_id')
                if workflow_id:
                    print(f"   Workflow ID: {workflow_id}")
                    
                    # O workflow_id pode estar em uma tabela diferente ou ser usado de forma diferente
                    # Vamos verificar se existe em agent_triggers com este ID
                    workflow_trigger_result = await client.table('agent_triggers').select('*').eq('trigger_id', workflow_id).execute()
                    if workflow_trigger_result.data:
                        workflow_trigger = workflow_trigger_result.data[0]
                        print(f"\n📋 WORKFLOW TRIGGER ENCONTRADO:")
                        print(f"   ID: {workflow_trigger['trigger_id']}")
                        print(f"   Nome: {workflow_trigger.get('name', 'N/A')}")
                        print(f"   Tipo: {workflow_trigger.get('trigger_type', 'N/A')}")
                        print(f"   Descrição: {workflow_trigger.get('description', 'N/A')}")
                        print(f"   Config: {workflow_trigger.get('config', {})}")
                        
                        # Este é provavelmente o workflow que contém as ações de email
                        workflow_config = workflow_trigger.get('config', {})
                        if 'email' in str(workflow_config).lower() or 'pipedream' in str(workflow_config).lower():
                            print(f"   🔍 CONFIGURAÇÃO DE EMAIL DETECTADA!")
                    else:
                        print(f"   ❌ Workflow trigger {workflow_id} não encontrado")
                        
        else:
            print(f"❌ Execução {EXECUTION_ID} não encontrada")
            
        print("\n✅ Análise concluída!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(query_execution())