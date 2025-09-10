#!/usr/bin/env python3
"""
Script para verificar status da automação do usuário start@prophet.build
"""

import asyncio
import os
import sys
from supabase import create_async_client

# Configurações de produção
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

PROJECT_ID = "a82bb16a-8add-4132-9ef6-11cae777aa18"
THREAD_ID = "8278cc41-d3aa-4481-bc2a-4a43a0ff0df8"
USER_EMAIL = "start@prophet.build"
AUTOMATION_ID = "8f787282-b4f2-48d5-bf63-d087114c849e"

async def check_automation_status():
    """Verificar status da automação"""
    
    try:
        print("🔍 Conectando ao Supabase...")
        client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        print(f"📧 Buscando usuário: {USER_EMAIL}")
        
        # Buscar usuário no auth.users (com service_role podemos acessar)
        try:
            # Primeiro tenta pelas auth.users diretamente 
            user_result = await client.auth.admin.list_users()
            user = None
            for u in user_result:
                if u.email == USER_EMAIL:
                    user = u
                    break
            
            if not user:
                print("❌ Usuário não encontrado no auth.users")
                return
                
            user_id = user.id
            print(f"✅ Usuário encontrado: {user.email} (ID: {user_id})")
            
        except Exception as auth_error:
            print(f"⚠️  Erro ao acessar auth.users: {auth_error}")
            # Fallback: buscar nos accounts via basejump
            print("🔄 Tentando buscar via basejump.accounts...")
            
            # Buscar diretamente do schema basejump usando RPC ou raw SQL
            from postgrest import APIResponse
            try:
                # Query raw SQL para buscar por email
                raw_result = await client.rpc('exec_sql', {'query': f"""
                    SELECT au.user_id, au.email 
                    FROM auth.users au 
                    WHERE au.email = '{USER_EMAIL}' 
                    LIMIT 1
                """}).execute()
                
                if raw_result.data and len(raw_result.data) > 0:
                    user_data = raw_result.data[0]
                    user_id = user_data['user_id']
                    print(f"✅ Usuário encontrado via SQL: {user_data['email']} (ID: {user_id})")
                else:
                    print("❌ Usuário não encontrado")
                    return
                    
            except Exception as sql_error:
                print(f"❌ Erro ao executar SQL: {sql_error}")
                # Último fallback - buscar direto por UUID se soubermos
                print("🔄 Usando busca direta por projeto...")
                user_id = None  # Will skip user validation
        
        # Verificar se o projeto existe
        print(f"\n🏗️ Verificando projeto: {PROJECT_ID}")
        project_result = await client.table('projects').select('id, name, account_id').eq('id', PROJECT_ID).execute()
        
        if not project_result.data:
            print("❌ Projeto não encontrado")
            return
            
        project = project_result.data[0]
        if user_id and project['account_id'] != user_id:
            print("❌ Projeto não pertence ao usuário especificado")
            print(f"   Projeto account_id: {project['account_id']}")
            print(f"   User ID: {user_id}")
            return
            
        print(f"✅ Projeto encontrado: {project['name']}")
        
        # Verificar thread
        print(f"\n💬 Verificando thread: {THREAD_ID}")
        thread_result = await client.table('threads').select('id, title, project_id, created_at').eq('id', THREAD_ID).execute()
        
        if not thread_result.data:
            print("❌ Thread não encontrada")
            return
            
        thread = thread_result.data[0]
        if thread['project_id'] != PROJECT_ID:
            print("❌ Thread não pertence ao projeto especificado")
            return
            
        print(f"✅ Thread encontrada: {thread['title']} (Criada: {thread['created_at']})")
        
        # Buscar triggers/automações da thread
        print(f"\n🤖 Buscando automações da thread...")
        triggers_result = await client.table('triggers').select('*').eq('thread_id', THREAD_ID).execute()
        
        if not triggers_result.data:
            print("❌ Nenhuma automação encontrada para esta thread")
            return
            
        print(f"✅ Encontradas {len(triggers_result.data)} automação(ões)")
        
        for trigger in triggers_result.data:
            print(f"\n🔧 Automação: {trigger['name']}")
            print(f"   ID: {trigger['id']}")
            print(f"   Status: {'🟢 Ativo' if trigger['is_active'] else '🔴 Inativo'}")
            print(f"   Tipo: {trigger['trigger_type']}")
            print(f"   Criado: {trigger['created_at']}")
            print(f"   Webhook URL: {trigger['webhook_url']}")
            
            if trigger.get('description'):
                print(f"   Descrição: {trigger['description']}")
            
        # Buscar execuções recentes (agent_runs)
        print(f"\n⚡ Buscando execuções recentes das automações...")
        
        # Buscar por thread_id e status
        runs_result = await client.table('agent_runs').select('*').eq('thread_id', THREAD_ID).order('created_at', desc=True).limit(10).execute()
        
        if not runs_result.data:
            print("❌ Nenhuma execução encontrada")
            return
            
        print(f"✅ Encontradas {len(runs_result.data)} execução(ões) recentes")
        
        for run in runs_result.data:
            print(f"\n🏃‍♂️ Execução: {run['id']}")
            print(f"   Status: {run['status']}")
            print(f"   Criado: {run['created_at']}")
            if run.get('completed_at'):
                print(f"   Concluído: {run['completed_at']}")
            if run.get('error'):
                print(f"   Erro: {run['error']}")
            
        # Buscar mensagens recentes da thread
        print(f"\n💬 Últimas mensagens da thread...")
        messages_result = await client.table('messages').select('id, role, content, created_at').eq('thread_id', THREAD_ID).order('created_at', desc=True).limit(5).execute()
        
        if messages_result.data:
            for msg in messages_result.data:
                role_emoji = "👤" if msg['role'] == 'user' else "🤖"
                content_preview = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
                print(f"   {role_emoji} {msg['created_at']}: {content_preview}")
        
        print("\n✅ Verificação concluída!")
        
    except Exception as e:
        print(f"❌ Erro ao verificar automação: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_automation_status())