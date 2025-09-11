#!/usr/bin/env python3
"""
Verificar execuções recentes dos triggers
"""

import asyncio
from supabase import create_async_client
from datetime import datetime, timedelta

# Configurações
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

async def check_trigger_executions():
    client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    print("🔍 Verificando execuções de triggers nas últimas 2 horas...")
    
    # Calcular timestamp de 2 horas atrás
    two_hours_ago = datetime.utcnow() - timedelta(hours=2)
    timestamp_filter = two_hours_ago.isoformat() + "Z"
    
    try:
        # Buscar eventos de trigger recentes
        events_result = await client.table('trigger_events')\
            .select('''
                event_id,
                trigger_id, 
                agent_id,
                timestamp,
                success,
                should_execute_agent,
                error_message,
                metadata
            ''')\
            .gte('timestamp', timestamp_filter)\
            .order('timestamp', desc=True)\
            .limit(20)\
            .execute()
        
        print(f"📊 Encontrados {len(events_result.data)} eventos de trigger")
        
        if events_result.data:
            for event in events_result.data:
                print(f"\n🔸 Evento {event['event_id'][:8]}...")
                print(f"   Trigger: {event['trigger_id'][:8]}...")
                print(f"   Agent: {event['agent_id'][:8]}...")
                print(f"   Timestamp: {event['timestamp']}")
                print(f"   Sucesso: {'✅' if event['success'] else '❌'}")
                print(f"   Deve executar agent: {'✅' if event['should_execute_agent'] else '❌'}")
                if event['error_message']:
                    print(f"   Erro: {event['error_message']}")
                if event['metadata']:
                    print(f"   Metadata: {event['metadata']}")
        else:
            print("❌ Nenhuma execução de trigger encontrada nas últimas 2 horas")
            
        # Buscar também triggers ativos para verificar se existe
        print(f"\n🔍 Verificando triggers ativos...")
        triggers_result = await client.table('agent_triggers')\
            .select('trigger_id, agent_id, name, trigger_type, is_active, config')\
            .eq('is_active', True)\
            .execute()
            
        print(f"📋 Triggers ativos: {len(triggers_result.data)}")
        for trigger in triggers_result.data:
            print(f"   • {trigger['name']} ({trigger['trigger_type']}) - Agent: {trigger['agent_id'][:8]}...")
            
        # Verificar se existe o trigger específico da automação
        AUTOMATION_TRIGGER_ID = "7163752f-d41e-472a-9fe9-e38b102012bb"
        specific_trigger = await client.table('agent_triggers')\
            .select('*')\
            .eq('trigger_id', AUTOMATION_TRIGGER_ID)\
            .execute()
            
        print(f"\n🔍 Trigger específico da automação ({AUTOMATION_TRIGGER_ID[:8]}...):")
        if specific_trigger.data:
            trigger = specific_trigger.data[0]
            print(f"   Nome: {trigger['name']}")
            print(f"   Tipo: {trigger['trigger_type']}")
            print(f"   Ativo: {'✅' if trigger['is_active'] else '❌'}")
            print(f"   Config: {trigger['config']}")
        else:
            print("   ❌ Trigger não encontrado")
            
    except Exception as e:
        print(f"❌ Erro ao verificar execuções: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_trigger_executions())