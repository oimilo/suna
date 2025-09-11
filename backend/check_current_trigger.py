#!/usr/bin/env python3
"""
Verificar detalhes do trigger atual
"""

import asyncio
import json
from supabase import create_async_client

# Configurações
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

async def check_current_trigger():
    client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    print("🔍 Verificando trigger atual da automação...")
    
    try:
        # Buscar o trigger ativo
        triggers_result = await client.table('agent_triggers')\
            .select('*')\
            .eq('is_active', True)\
            .execute()
        
        if triggers_result.data:
            trigger = triggers_result.data[0]
            
            print(f"✅ TRIGGER ENCONTRADO:")
            print(f"   ID: {trigger['trigger_id']}")
            print(f"   Nome: {trigger['name']}")
            print(f"   Tipo: {trigger['trigger_type']}")
            print(f"   Agent ID: {trigger['agent_id']}")
            print(f"   Ativo: {'✅' if trigger['is_active'] else '❌'}")
            print(f"   Execution Type: {trigger.get('execution_type', 'N/A')}")
            print(f"   Workflow ID: {trigger.get('workflow_id', 'N/A')}")
            print(f"   Criado: {trigger.get('created_at', 'N/A')}")
            
            print(f"\n📋 CONFIGURAÇÃO DO TRIGGER:")
            config = trigger.get('config', {})
            if isinstance(config, str):
                try:
                    config = json.loads(config)
                except:
                    pass
            print(json.dumps(config, indent=2, ensure_ascii=False))
            
            # Verificar se o workflow_id referenciado existe
            workflow_id = trigger.get('workflow_id')
            if workflow_id:
                print(f"\n🔍 Verificando se workflow {workflow_id} existe...")
                workflow_result = await client.table('agent_workflows')\
                    .select('id, name, status')\
                    .eq('id', workflow_id)\
                    .execute()
                    
                if workflow_result.data:
                    wf = workflow_result.data[0]
                    print(f"   ✅ Workflow encontrado: {wf['name']} (status: {wf['status']})")
                else:
                    print(f"   ❌ Workflow NÃO ENCONTRADO!")
                    
            print(f"\n⏰ Última execução registrada:")
            # Buscar último evento (mesmo que não haja, para confirmar)
            events_result = await client.table('trigger_events')\
                .select('*')\
                .eq('trigger_id', trigger['trigger_id'])\
                .order('timestamp', desc=True)\
                .limit(1)\
                .execute()
                
            if events_result.data:
                event = events_result.data[0]
                print(f"   Timestamp: {event.get('timestamp', 'N/A')}")
                print(f"   Sucesso: {'✅' if event.get('success') else '❌'}")
                print(f"   Erro: {event.get('error_message', 'Nenhum')}")
            else:
                print(f"   ❌ NENHUMA EXECUÇÃO REGISTRADA!")
                print(f"   Isso indica que o agendamento não está funcionando")
                
        else:
            print("❌ Nenhum trigger ativo encontrado")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_current_trigger())