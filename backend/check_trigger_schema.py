#!/usr/bin/env python3
"""
Verificar schema das tabelas de triggers
"""

import asyncio
from supabase import create_async_client

# Configurações
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

async def check_schema():
    client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    print("🔍 Verificando schema das tabelas...")
    
    try:
        # Verificar trigger_events - apenas um registro para ver colunas
        print("\n📋 Estrutura da tabela trigger_events:")
        events_result = await client.table('trigger_events').select('*').limit(1).execute()
        if events_result.data:
            print(f"   Colunas encontradas: {list(events_result.data[0].keys())}")
        else:
            print("   Tabela vazia, vou tentar uma consulta simples")
            try:
                simple_events = await client.table('trigger_events').select('*').execute()
                print(f"   Total de registros: {len(simple_events.data)}")
            except Exception as e:
                print(f"   Erro ao acessar: {e}")
        
        # Verificar agent_triggers
        print("\n📋 Estrutura da tabela agent_triggers:")
        triggers_result = await client.table('agent_triggers').select('*').limit(1).execute()
        if triggers_result.data:
            print(f"   Colunas encontradas: {list(triggers_result.data[0].keys())}")
            print(f"   Total de triggers: {len(triggers_result.data)}")
        
        # Buscar triggers específicos
        print(f"\n🔍 Buscando triggers ativos:")
        all_triggers = await client.table('agent_triggers')\
            .select('trigger_id, agent_id, name, trigger_type, is_active')\
            .eq('is_active', True)\
            .execute()
        
        for trigger in all_triggers.data:
            print(f"   • {trigger['name']} (ID: {trigger['trigger_id'][:8]}...)")
            print(f"     Tipo: {trigger['trigger_type']}, Agent: {trigger['agent_id'][:8]}...")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_schema())