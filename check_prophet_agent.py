#!/usr/bin/env python3
"""
Script para verificar e criar o agente Prophet padrão no banco de dados
"""
import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('frontend/.env.local')

# Configuração do Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados")
    print("   Certifique-se de que o arquivo frontend/.env.local existe e contém essas variáveis")
    exit(1)

# Criar cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def check_prophet_agents():
    """Verificar agentes Prophet no banco"""
    print("\n🔍 Buscando agentes com is_suna_default=true...")
    
    try:
        # Buscar todos os agentes com is_suna_default
        result = supabase.table('agents').select('*').execute()
        
        prophet_agents = []
        for agent in result.data:
            metadata = agent.get('metadata', {})
            if metadata.get('is_suna_default') == True:
                prophet_agents.append(agent)
        
        print(f"\n📊 Total de agentes no banco: {len(result.data)}")
        print(f"📊 Agentes Prophet (is_suna_default=true): {len(prophet_agents)}")
        
        if prophet_agents:
            print("\n✅ Agentes Prophet encontrados:")
            for agent in prophet_agents:
                print(f"\n  🤖 Agente: {agent['name']}")
                print(f"     ID: {agent['agent_id']}")
                print(f"     Account ID: {agent['account_id']}")
                print(f"     Is Default: {agent.get('is_default', False)}")
                print(f"     Created: {agent['created_at']}")
                print(f"     Metadata: {agent.get('metadata', {})}")
        else:
            print("\n⚠️  Nenhum agente Prophet (is_suna_default=true) encontrado!")
            
        # Verificar também agentes com nome "Prophet" ou "Suna"
        print("\n🔍 Buscando agentes por nome...")
        prophet_by_name = [a for a in result.data if a['name'] in ['Prophet', 'Suna']]
        
        if prophet_by_name:
            print(f"\n📊 Agentes com nome Prophet/Suna: {len(prophet_by_name)}")
            for agent in prophet_by_name:
                metadata = agent.get('metadata', {})
                print(f"\n  🤖 {agent['name']} (ID: {agent['agent_id']})")
                print(f"     is_suna_default: {metadata.get('is_suna_default', 'não definido')}")
                print(f"     is_default: {agent.get('is_default', False)}")
        
        # Listar primeiros 5 agentes para debug
        print("\n📋 Primeiros 5 agentes no banco (para debug):")
        for i, agent in enumerate(result.data[:5]):
            print(f"\n  {i+1}. {agent['name']} (ID: {agent['agent_id']})")
            print(f"     Metadata: {agent.get('metadata', {})}")
            
    except Exception as e:
        print(f"\n❌ Erro ao buscar agentes: {e}")
        return

async def check_specific_user_agents(user_id=None):
    """Verificar agentes de um usuário específico"""
    if user_id:
        print(f"\n🔍 Buscando agentes do usuário {user_id}...")
        try:
            result = supabase.table('agents').select('*').eq('account_id', user_id).execute()
            
            print(f"\n📊 Total de agentes do usuário: {len(result.data)}")
            for agent in result.data:
                metadata = agent.get('metadata', {})
                print(f"\n  🤖 {agent['name']} (ID: {agent['agent_id']})")
                print(f"     is_suna_default: {metadata.get('is_suna_default', False)}")
                print(f"     is_default: {agent.get('is_default', False)}")
                
        except Exception as e:
            print(f"\n❌ Erro: {e}")

async def main():
    print("🚀 Verificador de Agentes Prophet\n")
    print(f"📍 Supabase URL: {SUPABASE_URL}")
    
    await check_prophet_agents()
    
    # Se quiser verificar agentes de um usuário específico, 
    # descomente e coloque o ID do usuário:
    # await check_specific_user_agents('seu-user-id-aqui')
    
    print("\n✅ Verificação concluída!")

if __name__ == "__main__":
    asyncio.run(main())