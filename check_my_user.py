#!/usr/bin/env python3
"""
Script para encontrar o user_id baseado nos agentes criados
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('frontend/.env.local')

# Configuração do Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🔍 Buscando informações do agente Lulude...")

# Buscar o agente Lulude
result = supabase.table('agents').select('*').eq('agent_id', '827ea863-76f6-4b67-b449-df9b386cdf00').execute()

if result.data:
    agent = result.data[0]
    user_id = agent['account_id']
    print(f"\n✅ Agente Lulude encontrado!")
    print(f"   Account ID (seu user_id): {user_id}")
    
    # Buscar todos os agentes deste usuário
    print(f"\n🔍 Buscando todos os agentes do usuário {user_id}...")
    user_agents = supabase.table('agents').select('*').eq('account_id', user_id).execute()
    
    print(f"\n📊 Total de agentes: {len(user_agents.data)}")
    
    prophet_agent = None
    for agent in user_agents.data:
        metadata = agent.get('metadata', {})
        is_prophet = metadata.get('is_suna_default', False)
        
        print(f"\n  🤖 {agent['name']} (ID: {agent['agent_id']})")
        print(f"     is_default: {agent.get('is_default', False)}")
        print(f"     is_suna_default: {is_prophet}")
        print(f"     created_at: {agent['created_at']}")
        
        if is_prophet:
            prophet_agent = agent
    
    if prophet_agent:
        print(f"\n✅ Agente Prophet encontrado para seu usuário!")
        print(f"   ID: {prophet_agent['agent_id']}")
        print(f"   Nome: {prophet_agent['name']}")
    else:
        print(f"\n⚠️  Nenhum agente Prophet (is_suna_default=true) encontrado para seu usuário!")
        print("   Isso pode ser o problema - você precisa de um agente Prophet instalado.")
        
else:
    print("❌ Agente Lulude não encontrado!")