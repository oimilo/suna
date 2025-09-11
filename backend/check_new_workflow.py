#!/usr/bin/env python3
"""
Verificar o novo workflow criado pelo usuário
"""

import asyncio
import os
from supabase import create_async_client

# Configurações de produção
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

# Workflow criado pelo usuário
WORKFLOW_ID = "637d1e96-03d3-4d57-b76b-41cd9591f206"

async def check_new_workflow():
    try:
        print("🔍 Conectando ao Supabase...")
        client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        print(f"📊 Verificando workflow: {WORKFLOW_ID}")
        
        # 1. Buscar o workflow
        workflow_result = await client.table('agent_workflows').select('*').eq('id', WORKFLOW_ID).execute()
        
        if workflow_result.data:
            workflow = workflow_result.data[0]
            print(f"✅ WORKFLOW ENCONTRADO:")
            print(f"   ID: {workflow['id']}")
            print(f"   Agent ID: {workflow['agent_id']}")
            print(f"   Nome: {workflow['name']}")
            print(f"   Descrição: {workflow.get('description', 'N/A')}")
            print(f"   Status: {workflow['status']}")
            print(f"   Criado: {workflow.get('created_at')}")
            
            # 2. Buscar steps do workflow
            print(f"\n📋 STEPS DO WORKFLOW:")
            steps_result = await client.table('workflow_steps').select('*').eq('workflow_id', WORKFLOW_ID).order('step_order').execute()
            
            if steps_result.data:
                for i, step in enumerate(steps_result.data, 1):
                    print(f"   Step {step['step_order']}: {step['name']}")
                    print(f"      Tipo: {step['type']}")
                    print(f"      Config: {step.get('config', {})}")
                    if step.get('description'):
                        print(f"      Descrição: {step['description']}")
                    print()
            else:
                print("   ❌ Nenhum step encontrado para este workflow")
                
            # 3. Verificar se existe steps JSON inline (formato antigo)
            if 'steps' in workflow and workflow['steps']:
                print(f"\n📋 STEPS INLINE (formato antigo):")
                steps_json = workflow['steps']
                if isinstance(steps_json, list):
                    for i, step in enumerate(steps_json, 1):
                        print(f"   Step {i}: {step}")
                else:
                    print(f"   Steps: {steps_json}")
                    
            # 4. Buscar agent relacionado
            agent_id = workflow['agent_id']
            print(f"\n🤖 AGENT RELACIONADO ({agent_id}):")
            agent_result = await client.table('agents').select('name, account_id').eq('agent_id', agent_id).execute()
            
            if agent_result.data:
                agent = agent_result.data[0]
                print(f"   Nome: {agent.get('name', 'N/A')}")
                print(f"   Account ID: {agent.get('account_id')}")
            else:
                print("   ❌ Agent não encontrado")
                
        else:
            print(f"❌ Workflow {WORKFLOW_ID} não encontrado")
            
            # Buscar workflows recentes para debug
            print(f"\n🔍 WORKFLOWS RECENTES (últimos 10):")
            recent_result = await client.table('agent_workflows').select('id, name, agent_id, status, created_at').order('created_at', desc=True).limit(10).execute()
            
            if recent_result.data:
                for wf in recent_result.data:
                    print(f"   {wf['id']} - {wf['name']} ({wf['status']}) - {wf.get('created_at', 'N/A')[:19]}")
            
        print(f"\n✅ Verificação concluída!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_new_workflow())