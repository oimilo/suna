#!/usr/bin/env python3
"""
Script direto para verificar automação específica
"""

import asyncio
from supabase import create_async_client

# Configurações de produção
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

AUTOMATION_ID = "8f787282-b4f2-48d5-bf63-d087114c849e"
THREAD_ID = "8278cc41-d3aa-4481-bc2a-4a43a0ff0df8"

async def check_automation():
    try:
        print("🔍 Conectando ao Supabase...")
        client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # 1. Buscar automação diretamente pelo ID
        print(f"🎯 Buscando automação: {AUTOMATION_ID}")
        
        # Primeiro tentar na tabela 'triggers'
        trigger_result = await client.table('triggers').select('*').eq('id', AUTOMATION_ID).execute()
        
        if trigger_result.data:
            trigger = trigger_result.data[0]
            status_emoji = "🟢" if trigger.get('is_active') else "🔴"
            
            print(f"\n{status_emoji} AUTOMAÇÃO ENCONTRADA:")
            print(f"   ID: {trigger['id']}")
            print(f"   Nome: {trigger.get('name', 'Sem nome')}")
            print(f"   Status: {'ATIVO' if trigger.get('is_active') else 'INATIVO'}")
            print(f"   Tipo: {trigger.get('trigger_type', 'N/A')}")
            print(f"   Thread ID: {trigger.get('thread_id', 'N/A')}")
            print(f"   Criado: {trigger.get('created_at', 'N/A')}")
            
            if trigger.get('webhook_url'):
                print(f"   Webhook: {trigger['webhook_url']}")
            
            if trigger.get('description'):
                print(f"   Descrição: {trigger['description']}")
                
            if trigger.get('config'):
                print(f"   Config: {trigger['config']}")
        else:
            print("❌ Automação não encontrada na tabela 'triggers'")
            
            # Tentar em outras tabelas possíveis
            print("🔍 Tentando tabela 'workflows'...")
            workflow_result = await client.table('workflows').select('*').eq('id', AUTOMATION_ID).execute()
            
            if workflow_result.data:
                workflow = workflow_result.data[0]
                print(f"\n🟢 WORKFLOW ENCONTRADO:")
                print(f"   ID: {workflow['id']}")
                print(f"   Nome: {workflow.get('name', 'Sem nome')}")
                for key, value in workflow.items():
                    if key not in ['id', 'name']:
                        print(f"   {key}: {value}")
            else:
                print("❌ Não encontrado em 'workflows' também")
        
        # 2. Buscar execuções relacionadas
        print(f"\n⚡ Buscando execuções da thread {THREAD_ID}...")
        runs_result = await client.table('agent_runs').select('*').eq('thread_id', THREAD_ID).order('created_at', desc=True).limit(5).execute()
        
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
        messages_result = await client.table('messages').select('role, content, created_at').eq('thread_id', THREAD_ID).order('created_at', desc=True).limit(3).execute()
        
        if messages_result.data:
            for msg in messages_result.data:
                role_emoji = "👤" if msg.get('role') == 'user' else "🤖"
                content = msg.get('content', '')
                preview = content[:100] + "..." if len(content) > 100 else content
                timestamp = msg.get('created_at', 'N/A')[:19] if msg.get('created_at') else 'N/A'
                print(f"  {role_emoji} {timestamp}: {preview}")
        
        print("\n✅ Verificação concluída!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_automation())