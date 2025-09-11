#!/usr/bin/env python3
"""
Testar execução do workflow com o project_id correto
"""

import asyncio
import json
import uuid
from datetime import datetime
import httpx

# Configurações
API_URL = "https://prophet-milo-f3hr5.ondigitalocean.app"
INTERNAL_SECRET = "sk_trigger_7f9a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0"

# IDs corretos do banco
TRIGGER_ID = "6832c764-5eca-4b6c-8386-528c7d011ded"
WORKFLOW_ID = "637d1e96-03d3-4d57-b76b-41cd9591f206"
AGENT_ID = "025c750a-4945-408d-b2b3-ba83d06add94"
THREAD_ID = "ab5b1cd6-cc07-4327-af29-c6cd0fae77ca"
PROJECT_ID = "eb893241-6c5c-4fce-90fa-f25c27b9b758"  # Project mais recente de automação

async def test_workflow_execution():
    """Testar execução do workflow com project_id correto"""
    
    # Gerar novo agent_run_id para este teste
    agent_run_id = str(uuid.uuid4())
    
    print("🚀 TESTE DE EXECUÇÃO DO WORKFLOW COM PROJECT_ID CORRETO")
    print("=" * 60)
    print(f"   Trigger ID: {TRIGGER_ID}")
    print(f"   Workflow ID: {WORKFLOW_ID}")
    print(f"   Agent ID: {AGENT_ID}")
    print(f"   Thread ID: {THREAD_ID}")
    print(f"   Project ID: {PROJECT_ID} (Automação de Email Planilha)")
    print(f"   Agent Run ID: {agent_run_id}")
    print("=" * 60)
    
    # Preparar payload para execução
    payload = {
        "agent_run_id": agent_run_id,
        "thread_id": THREAD_ID,
        "project_id": PROJECT_ID,
        "agent_config": {
            "agent_id": AGENT_ID,
            "name": "Prophet",
            "project_id": PROJECT_ID
        },
        "trigger_variables": {
            "message": f"Teste workflow com project correto - {datetime.now().isoformat()}",
            "planilha_url": "https://docs.google.com/spreadsheets/d/1Y7H46n0rT7jyh8yNipwXbF1tHVJ0sc57PhB9xXTnQsU/edit",
            "email_destino": "start@prophet.build",
            "test_mode": True
        },
        "workflow_id": WORKFLOW_ID,
        "execution_type": "workflow"
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET
    }
    
    print("\n📤 Enviando requisição para API...")
    print(f"   URL: {API_URL}/api/internal/execute-agent")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{API_URL}/api/internal/execute-agent",
                json=payload,
                headers=headers
            )
            
            print(f"\n📥 Resposta recebida:")
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ SUCESSO! Workflow iniciado!")
                print(f"   Response: {json.dumps(result, indent=2)}")
                
                if result.get("success"):
                    print(f"\n🎉 WORKFLOW EXECUTADO COM SUCESSO!")
                    print(f"   Agent Run ID: {result.get('agent_run_id', agent_run_id)}")
                    print(f"   Thread ID: {result.get('thread_id')}")
                    print(f"   Project ID usado: {PROJECT_ID}")
                else:
                    print(f"\n⚠️  Execução retornou success=false")
                    print(f"   Erro: {result.get('error', 'Não especificado')}")
            else:
                print(f"   ❌ ERRO HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                
                if "Project" in response.text and "not found" in response.text:
                    print(f"\n🚨 ERRO DE PROJECT NOT FOUND AINDA PRESENTE!")
                    print(f"   O servidor ainda está usando o project_id incorreto")
                    
        except httpx.TimeoutException:
            print(f"   ⏱️  Timeout na requisição (30s)")
            print(f"   Isso pode indicar que o servidor está processando")
            
        except Exception as e:
            print(f"   ❌ Erro na requisição: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("🔍 VERIFICANDO STATUS NO BANCO...")
    
    # Aguardar um pouco para dar tempo de processar
    await asyncio.sleep(3)
    
    # Verificar se foi criado no banco
    from supabase import create_async_client
    
    SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"
    
    supabase = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Verificar agent_run
    result = await supabase.table('agent_runs').select('*').eq('id', agent_run_id).execute()
    
    if result.data:
        run = result.data[0]
        print(f"✅ Agent Run encontrado no banco!")
        print(f"   Status: {run.get('status')}")
        print(f"   Error: {run.get('error', 'Nenhum')}")
        
        if "not found" in str(run.get('error', '')).lower():
            print(f"\n🚨 ERRO DE PROJECT NOT FOUND NO BANCO!")
            print(f"   O problema persiste mesmo com project_id correto")
            print(f"   Isso indica que o erro está no código do servidor")
        elif run.get('status') == 'completed':
            print(f"\n🎉 WORKFLOW EXECUTADO COM SUCESSO!")
            print(f"   O problema foi resolvido!")
        elif run.get('status') == 'running':
            print(f"\n⏳ Execução ainda em andamento...")
            print(f"   Aguarde alguns segundos e verifique novamente")
    else:
        print(f"❌ Agent Run {agent_run_id} não encontrado no banco")
        print(f"   Isso pode indicar que a execução falhou antes de criar o registro")
    
    print("\n✅ Teste concluído!")

if __name__ == "__main__":
    asyncio.run(test_workflow_execution())