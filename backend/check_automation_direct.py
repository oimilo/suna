#!/usr/bin/env python3
"""
Script direto para verificar automação específica
"""

import asyncio
from supabase import create_async_client

# Configurações de produção
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

AUTOMATION_ID = "7163752f-d41e-472a-9fe9-e38b102012bb"
THREAD_ID = "ab5b1cd6-cc07-4327-af29-c6cd0fae77ca"  # Thread usada no teste
DEBUG_AGENT_RUN_ID = "c75ef691-80d4-4a9e-87da-2df937efe9db"

async def check_automation():
    try:
        print("🔍 Conectando ao Supabase...")
        client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # 1. Buscar automação diretamente pelo ID
        print(f"🎯 Buscando automação: {AUTOMATION_ID}")
        
        # Primeiro tentar na tabela 'agent_triggers'
        trigger_result = await client.table('agent_triggers').select('*').eq('trigger_id', AUTOMATION_ID).execute()
        
        found_trigger = None
        if trigger_result.data:
            trigger = trigger_result.data[0]
            found_trigger = trigger
            status_emoji = "🟢" if trigger.get('is_active') else "🔴"
            
            print(f"\n{status_emoji} AUTOMAÇÃO ENCONTRADA:")
            print(f"   ID: {trigger['trigger_id']}")
            print(f"   Nome: {trigger.get('name', 'Sem nome')}")
            print(f"   Status: {'ATIVO' if trigger.get('is_active') else 'INATIVO'}")
            print(f"   Tipo: {trigger.get('trigger_type', 'N/A')}")
            print(f"   Agent ID: {trigger.get('agent_id', 'N/A')}")
            print(f"   Criado: {trigger.get('created_at', 'N/A')}")
            
            if trigger.get('description'):
                print(f"   Descrição: {trigger['description']}")
                
            if trigger.get('config'):
                print(f"   Config: {trigger['config']}")
                
                # Analisar configuração específica para email
                config = trigger.get('config', {})
                workflow_id = config.get('workflow_id')
                if workflow_id:
                    print(f"\n🔍 WORKFLOW CONECTADO: {workflow_id}")
                    print(f"   Este é o workflow que define as ações da automação")
                    
                    # Buscar detalhes do workflow
                    try:
                        workflow_result = await client.table('agent_workflows').select('*').eq('workflow_id', workflow_id).execute()
                        if workflow_result.data:
                            workflow = workflow_result.data[0]
                            print(f"\n📋 DETALHES DO WORKFLOW:")
                            print(f"   ID: {workflow.get('workflow_id')}")
                            print(f"   Nome: {workflow.get('name', 'Sem nome')}")
                            print(f"   Thread ID: {workflow.get('thread_id')}")
                            print(f"   Agent ID: {workflow.get('agent_id')}")
                            print(f"   Ativo: {workflow.get('is_active', 'N/A')}")
                            
                            if workflow.get('workflow_data'):
                                workflow_data = workflow.get('workflow_data')
                                print(f"   Dados do Workflow: {workflow_data}")
                                
                                # Verificar se há configurações de email
                                if isinstance(workflow_data, dict):
                                    if 'email' in str(workflow_data).lower() or 'pipedream' in str(workflow_data).lower():
                                        print(f"   🔍 POSSÍVEL CONFIGURAÇÃO DE EMAIL DETECTADA!")
                            
                        else:
                            print(f"   ❌ Workflow {workflow_id} não encontrado na tabela agent_workflows")
                    except Exception as workflow_error:
                        print(f"   ⚠️  Erro ao buscar workflow: {workflow_error}")
        else:
            print("❌ Automação específica não encontrada")
            
            # Buscar qualquer automação existente
            print("🔍 Buscando automações existentes...")
            try:
                any_triggers = await client.table('agent_triggers').select('*').limit(3).execute()
                if any_triggers.data:
                    print(f"✅ Encontradas {len(any_triggers.data)} automações na base:")
                    for trigger in any_triggers.data:
                        status_emoji = "🟢" if trigger.get('is_active') else "🔴"
                        print(f"  {status_emoji} {trigger['trigger_id'][:8]}... - {trigger.get('name', 'Sem nome')}")
                    # Usar a primeira automação encontrada
                    found_trigger = any_triggers.data[0]
                else:
                    print("❌ Nenhuma automação encontrada na base")
            except Exception as e:
                print(f"❌ Erro ao buscar automações: {e}")
        
        # 2. Buscar execuções relacionadas da automação específica
        automation_thread_id = None
        if found_trigger and found_trigger.get('trigger_id') == AUTOMATION_ID:
            # Se encontramos a automação, podemos tentar deduzir o thread_id dela
            # Baseado na estrutura, vamos buscar por qualquer execução com esta automação
            print(f"\n⚡ Buscando execuções da automação {AUTOMATION_ID}...")
            
            # Tentar buscar por workflow_triggers que conecta automação com threads
            try:
                workflow_result = await client.table('agent_workflows').select('thread_id').eq('trigger_id', AUTOMATION_ID).execute()
                if workflow_result.data:
                    automation_thread_id = workflow_result.data[0]['thread_id']
                    print(f"📋 Thread ID da automação encontrado: {automation_thread_id}")
                else:
                    print("🔍 Nenhum workflow encontrado para esta automação")
            except Exception as workflow_error:
                print(f"⚠️  Erro ao buscar workflow: {workflow_error}")
        
        # Buscar execuções usando o thread_id da automação ou fallback para o teste
        target_thread_id = automation_thread_id or THREAD_ID
        print(f"\n⚡ Buscando execuções da thread {target_thread_id}...")
        runs_result = await client.table('agent_runs').select('*').eq('thread_id', target_thread_id).order('created_at', desc=True).limit(10).execute()
        
        if runs_result.data:
            print(f"✅ Últimas {len(runs_result.data)} execuções:")
            
            for run in runs_result.data:
                status = run.get('status', 'unknown')
                status_emoji = {
                    'completed': '✅',
                    'running': '🔄', 
                    'failed': '❌',
                    'pending': '⏳',
                    'cancelled': '🚫'
                }.get(status, '❓')
                
                print(f"\n  {status_emoji} {run['id'][:8]}... ({status})")
                print(f"     Criado: {run.get('created_at', 'N/A')[:19]}")
                
                if run.get('completed_at'):
                    print(f"     Concluído: {run.get('completed_at', 'N/A')[:19]}")
                    
                if run.get('error'):
                    print(f"     Erro: {run['error'][:100]}...")
        else:
            print("❌ Nenhuma execução encontrada")
        
        # 3. Verificar mensagens recentes da thread
        print(f"\n💬 Últimas mensagens da thread...")
        try:
            messages_result = await client.table('messages').select('type, content, created_at').eq('thread_id', THREAD_ID).order('created_at', desc=True).limit(3).execute()
            
            if messages_result.data:
                for msg in messages_result.data:
                    role_emoji = "👤" if msg.get('type') == 'user' else "🤖"
                    content = msg.get('content', '')
                    preview = content[:100] + "..." if len(content) > 100 else content
                    timestamp = msg.get('created_at', 'N/A')[:19] if msg.get('created_at') else 'N/A'
                    print(f"  {role_emoji} {timestamp}: {preview}")
            else:
                print("❌ Nenhuma mensagem encontrada")
        except Exception as msg_error:
            print(f"⚠️  Erro ao buscar mensagens: {msg_error}")
        
        # 4. Buscar dados válidos para teste (NEW)
        print(f"\n🔍 BUSCANDO DADOS VÁLIDOS PARA TESTE...")
        
        # Buscar threads disponíveis
        print("📝 Buscando threads disponíveis...")
        threads_result = await client.table('threads').select('thread_id, account_id, project_id, created_at').order('created_at', desc=True).limit(10).execute()
        
        valid_combinations = []
        
        if threads_result.data:
            print(f"✅ Encontradas {len(threads_result.data)} threads")
            
            for thread in threads_result.data:
                thread_id = thread['thread_id']
                project_id = thread['project_id']
                account_id = thread['account_id']
                
                # Verificar se tem project associado
                if project_id:
                    project_result = await client.table('projects').select('project_id, name, account_id').eq('project_id', project_id).execute()
                    
                    if project_result.data:
                        project = project_result.data[0]
                        
                        # Buscar agents para esta account
                        # Assumindo que existe uma tabela 'agents' baseada no schema agent_triggers
                        try:
                            agents_result = await client.table('agents').select('agent_id, name, account_id').eq('account_id', account_id).limit(3).execute()
                            
                            if agents_result.data:
                                for agent in agents_result.data:
                                    combination = {
                                        'thread_id': thread_id,
                                        'project_id': project_id,
                                        'agent_id': agent['agent_id'],
                                        'account_id': account_id,
                                        'project_name': project['name'],
                                        'agent_name': agent['name'],
                                        'thread_created': thread['created_at']
                                    }
                                    valid_combinations.append(combination)
                                    
                        except Exception as agent_error:
                            print(f"⚠️  Erro ao buscar agents: {agent_error}")
                            # Tentar buscar agent_id da automação existente
                            if found_trigger:
                                trigger_agent_id = found_trigger.get('agent_id')
                                if trigger_agent_id:
                                    combination = {
                                        'thread_id': thread_id,
                                        'project_id': project_id,
                                        'agent_id': trigger_agent_id,
                                        'account_id': account_id,
                                        'project_name': project['name'],
                                        'agent_name': 'Agent da automação',
                                        'thread_created': thread['created_at']
                                    }
                                    valid_combinations.append(combination)
        
        # Exibir combinações válidas encontradas
        if valid_combinations:
            print(f"\n🎯 ENCONTRADAS {len(valid_combinations)} COMBINAÇÕES VÁLIDAS:")
            for i, combo in enumerate(valid_combinations[:5], 1):  # Mostrar apenas 5
                print(f"\n  {i}. 📋 COMBINAÇÃO {i}:")
                print(f"     Thread ID: {combo['thread_id']}")
                print(f"     Project ID: {combo['project_id']}")
                print(f"     Agent ID: {combo['agent_id']}")
                print(f"     Account ID: {combo['account_id']}")
                print(f"     Project: {combo['project_name']}")
                print(f"     Agent: {combo['agent_name']}")
                print(f"     Thread criada: {combo['thread_created'][:19]}")
                
            # Recomendar a melhor combinação para teste
            best_combo = valid_combinations[0]
            print(f"\n🏆 RECOMENDAÇÃO PARA TESTE:")
            print(f"   Thread ID: {best_combo['thread_id']}")
            print(f"   Project ID: {best_combo['project_id']}")  
            print(f"   Agent ID: {best_combo['agent_id']}")
            
            # Comando curl para testar
            import uuid
            test_agent_run_id = str(uuid.uuid4())
            
            print(f"\n🧪 COMANDO PARA TESTAR:")
            print(f"curl -X POST 'https://prophet-milo-f3hr5.ondigitalocean.app/api/internal/execute-agent' \\")
            print(f"  -H 'Content-Type: application/json' \\")
            print(f"  -H 'x-internal-secret: sk_trigger_7f9a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0' \\")
            print(f"  -d '{{")
            print(f"    \"agent_run_id\": \"{test_agent_run_id}\",")
            print(f"    \"thread_id\": \"{best_combo['thread_id']}\",")
            print(f"    \"project_id\": \"{best_combo['project_id']}\",")
            print(f"    \"agent_config\": {{\"name\": \"Test Agent\", \"agent_id\": \"{best_combo['agent_id']}\"}},")
            print(f"    \"trigger_variables\": {{\"message\": \"Teste debugging erro boolean\"}}")
            print(f"  }}' -v")
            
            print(f"\n🔍 AGENT RUN ID PARA DEBUG: {test_agent_run_id}")
            print(f"   Use este ID para verificar logs de debug após execução")
            
        else:
            print("❌ Nenhuma combinação válida encontrada")
        
        # 5. Verificar nossa execução de teste específica
        print(f"\n🧪 VERIFICANDO EXECUÇÃO DE TESTE {DEBUG_AGENT_RUN_ID}...")
        print(f"🔍 VERIFICANDO NOVA EXECUÇÃO DE TESTE: 63a6732a-feb5-40d1-a75b-6e271294445b...")
        print(f"🔬 VERIFICANDO EXECUÇÃO ATUAL DE DEBUG: 0cedd4c7-fc61-43d4-9a3b-d83761dff50a...")
        print(f"🔬 VERIFICANDO SEGUNDA EXECUÇÃO DE DEBUG: test-boolean-debug-2...")
        
        try:
            test_run_result = await client.table('agent_runs').select('*').eq('id', DEBUG_AGENT_RUN_ID).execute()
            new_test_run_result = await client.table('agent_runs').select('*').eq('id', '63a6732a-feb5-40d1-a75b-6e271294445b').execute()
            current_test_run_result = await client.table('agent_runs').select('*').eq('id', '0cedd4c7-fc61-43d4-9a3b-d83761dff50a').execute()
            second_test_run_result = await client.table('agent_runs').select('*').eq('id', 'test-boolean-debug-2').execute()
            
            # Check old test run
            if test_run_result.data:
                test_run = test_run_result.data[0]
                status = test_run.get('status', 'unknown')
                status_emoji = {
                    'completed': '✅',
                    'running': '🔄', 
                    'failed': '❌',
                    'pending': '⏳',
                    'cancelled': '🚫'
                }.get(status, '❓')
                
                print(f"\n{status_emoji} EXECUÇÃO DE TESTE ANTIGA ENCONTRADA:")
                print(f"   ID: {test_run['id']}")
                print(f"   Status: {status}")
                print(f"   Thread ID: {test_run['thread_id']}")
                print(f"   Criado: {test_run.get('started_at', 'N/A')[:19]}")
                
                if test_run.get('completed_at'):
                    print(f"   Concluído: {test_run.get('completed_at', 'N/A')[:19]}")
                    
                if test_run.get('error'):
                    print(f"   🚨 ERRO CAPTURADO: {test_run['error']}")
                    
                    # Se há erro, isso pode ser nosso erro boolean!
                    if 'bool' in test_run['error'].lower():
                        print("   🎯 ERRO BOOLEAN DETECTADO!")
                        print("   📊 Este é exatamente o erro que estávamos procurando!")
            else:
                print("❌ Execução de teste antiga não encontrada na base de dados")
                
            # Check new test run
            if new_test_run_result.data:
                new_test_run = new_test_run_result.data[0]
                status = new_test_run.get('status', 'unknown')
                status_emoji = {
                    'completed': '✅',
                    'running': '🔄', 
                    'failed': '❌',
                    'pending': '⏳',
                    'cancelled': '🚫'
                }.get(status, '❓')
                
                print(f"\n{status_emoji} NOVA EXECUÇÃO DE TESTE ENCONTRADA:")
                print(f"   ID: {new_test_run['id']}")
                print(f"   Status: {status}")
                print(f"   Thread ID: {new_test_run['thread_id']}")
                print(f"   Criado: {new_test_run.get('started_at', 'N/A')[:19]}")
                
                if new_test_run.get('completed_at'):
                    print(f"   Concluído: {new_test_run.get('completed_at', 'N/A')[:19]}")
                    
                if new_test_run.get('error'):
                    print(f"   🚨 ERRO CAPTURADO: {new_test_run['error']}")
                    
                    # Se há erro, isso pode ser nosso erro boolean!
                    if 'bool' in new_test_run['error'].lower():
                        print("   🎯 ERRO BOOLEAN DETECTADO!")
                        print("   📊 Este é exatamente o erro que estávamos procurando!")
                    elif 'Thread not found' in new_test_run['error']:
                        print("   🔍 ERRO DE THREAD NOT FOUND DETECTADO!")
                        print("   📊 O sistema de debugging está funcionando - erro capturado antes da execução!")
            else:
                print("❌ Nova execução de teste não encontrada na base de dados")
                print("⚠️  Isso pode indicar que a execução falhou antes de ser registrada")
                
            # Check current test run  
            if current_test_run_result.data:
                current_test_run = current_test_run_result.data[0]
                status = current_test_run.get('status', 'unknown')
                status_emoji = {
                    'completed': '✅',
                    'running': '🔄', 
                    'failed': '❌',
                    'pending': '⏳',
                    'cancelled': '🚫'
                }.get(status, '❓')
                
                print(f"\n{status_emoji} EXECUÇÃO ATUAL DE DEBUG ENCONTRADA:")
                print(f"   ID: {current_test_run['id']}")
                print(f"   Status: {status}")
                print(f"   Thread ID: {current_test_run['thread_id']}")
                print(f"   Criado: {current_test_run.get('started_at', 'N/A')[:19]}")
                
                if current_test_run.get('completed_at'):
                    print(f"   Concluído: {current_test_run.get('completed_at', 'N/A')[:19]}")
                    
                if current_test_run.get('error'):
                    print(f"   🚨 ERRO CAPTURADO: {current_test_run['error']}")
                    
                    # Se há erro, isso pode ser nosso erro boolean!
                    if 'bool' in current_test_run['error'].lower():
                        print("   🎯 ERRO BOOLEAN DETECTADO!")
                        print("   📊 Este é exatamente o erro que estávamos procurando!")
                        print("   🔍 Sistema de debugging funcionando perfeitamente!")
                else:
                    print("   ℹ️  Sem erros reportados - execução ainda em andamento ou bem-sucedida")
            else:
                print("❌ Execução atual de debug não encontrada na base de dados")
                print("⚠️  Pode indicar problema na criação do agent_run ou execução muito recente")
                
            # Check second test run  
            if second_test_run_result.data:
                second_test_run = second_test_run_result.data[0]
                status = second_test_run.get('status', 'unknown')
                status_emoji = {
                    'completed': '✅',
                    'running': '🔄', 
                    'failed': '❌',
                    'pending': '⏳',
                    'cancelled': '🚫'
                }.get(status, '❓')
                
                print(f"\n{status_emoji} SEGUNDA EXECUÇÃO DE DEBUG ENCONTRADA:")
                print(f"   ID: {second_test_run['id']}")
                print(f"   Status: {status}")
                print(f"   Thread ID: {second_test_run['thread_id']}")
                print(f"   Criado: {second_test_run.get('started_at', 'N/A')[:19]}")
                
                if second_test_run.get('completed_at'):
                    print(f"   Concluído: {second_test_run.get('completed_at', 'N/A')[:19]}")
                    
                if second_test_run.get('error'):
                    print(f"   🚨 ERRO CAPTURADO: {second_test_run['error']}")
                    
                    # Se há erro, isso pode ser nosso erro boolean!
                    if 'bool' in second_test_run['error'].lower():
                        print("   🎯 ERRO BOOLEAN DETECTADO NA SEGUNDA EXECUÇÃO!")
                        print("   📊 Sistema de debugging capturou o erro com sucesso!")
                        print("   🔍 Agora podemos analisar as condições que causam este erro!")
                else:
                    print("   ℹ️  Sem erros reportados - execução bem-sucedida")
            else:
                print("❌ Segunda execução de debug não encontrada na base de dados")
                
        except Exception as test_error:
            print(f"❌ Erro ao verificar execução de teste: {test_error}")
        
        print("\n✅ Verificação concluída!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_automation())