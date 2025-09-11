#!/usr/bin/env python3
"""
Verificar o workflow criado com estrutura mais simples
"""

import asyncio
import json
from supabase import create_async_client

# Configurações
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

WORKFLOW_ID = "637d1e96-03d3-4d57-b76b-41cd9591f206"

async def check_workflow():
    client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    print(f"🔍 Verificando workflow: {WORKFLOW_ID}")
    
    # Buscar workflow completo
    result = await client.table('agent_workflows').select('*').eq('id', WORKFLOW_ID).execute()
    
    if result.data:
        workflow = result.data[0]
        
        print(f"✅ WORKFLOW: {workflow['name']}")
        print(f"   Status: {workflow['status']}")
        print(f"   Agent ID: {workflow['agent_id']}")
        
        # Verificar se tem steps como JSONB
        if 'steps' in workflow and workflow['steps']:
            print(f"\n📋 STEPS (JSONB):")
            steps = workflow['steps']
            if isinstance(steps, list):
                for i, step in enumerate(steps, 1):
                    print(f"   Step {i}: {json.dumps(step, indent=2)}")
            else:
                print(f"   Steps: {json.dumps(steps, indent=2)}")
        else:
            print(f"\n❌ Nenhum step encontrado no campo 'steps'")
            
        print(f"\n🔍 ESTRUTURA COMPLETA DO WORKFLOW:")
        for key, value in workflow.items():
            if key == 'steps' and value:
                print(f"   {key}: [STEPS - ver acima]")
            else:
                print(f"   {key}: {value}")
    else:
        print(f"❌ Workflow não encontrado")

if __name__ == "__main__":
    asyncio.run(check_workflow())