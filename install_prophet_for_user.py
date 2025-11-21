#!/usr/bin/env python3
"""
Script para instalar o agente Prophet para um usuário específico
"""
import os
import uuid
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('frontend/.env.local')

# Configuração do Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ID do usuário (encontrado no script anterior)
USER_ID = '92385ad2-e7ad-457e-b493-3a77bfe0d006'

def install_prophet_agent():
    """Instalar agente Prophet para o usuário"""
    print(f"🚀 Instalando agente Prophet para usuário {USER_ID}...")
    
    # Configuração do agente Prophet
    agent_data = {
        "agent_id": str(uuid.uuid4()),
        "account_id": USER_ID,
        "name": "Prophet",
        "description": "Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.",
        "is_default": True,
        "avatar": "🌞",
        "avatar_color": "#F59E0B",
        "metadata": {
            "is_prophet_default": True,
            "centrally_managed": True,
            "restrictions": {
                "system_prompt_editable": False,
                "tools_editable": False,
                "name_editable": False,
                "description_editable": True,
                "mcps_editable": True
            },
            "installation_date": datetime.now(timezone.utc).isoformat(),
            "last_central_update": datetime.now(timezone.utc).isoformat()
        },
        "config": {
            "tools": {
                "mcp": [],
                "custom_mcp": [],
                "agentpress": {}
            },
            "metadata": {
                "is_prophet_default": True,
                "centrally_managed": True
            }
        },
        "version_count": 1
    }
    
    try:
        # Inserir o agente
        result = supabase.table('agents').insert(agent_data).execute()
        
        if result.data:
            agent = result.data[0]
            print(f"\n✅ Agente Prophet instalado com sucesso!")
            print(f"   ID: {agent['agent_id']}")
            print(f"   Nome: {agent['name']}")
            print(f"   Account ID: {agent['account_id']}")
            return agent['agent_id']
        else:
            print("❌ Erro ao instalar agente - sem dados retornados")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao instalar agente: {e}")
        
        # Se falhar por já existir um agente default, vamos atualizar o existente
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            print("\n🔄 Tentando atualizar agente default existente...")
            
            # Buscar agente default existente
            existing = supabase.table('agents').select('*').eq('account_id', USER_ID).eq('is_default', True).execute()
            
            if existing.data:
                agent_id = existing.data[0]['agent_id']
                print(f"   Atualizando agente {agent_id}...")
                
                # Atualizar para ser Prophet
                update_data = {
                    "name": "Prophet",
                    "description": "Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.",
                    "avatar": "🌞",
                    "avatar_color": "#F59E0B",
                    "metadata": agent_data["metadata"],
                    "config": agent_data["config"]
                }
                
                update_result = supabase.table('agents').update(update_data).eq('agent_id', agent_id).execute()
                
                if update_result.data:
                    print(f"\n✅ Agente atualizado para Prophet com sucesso!")
                    print(f"   ID: {agent_id}")
                    return agent_id
        
        return None

if __name__ == "__main__":
    agent_id = install_prophet_agent()
    
    if agent_id:
        print("\n🎉 Agente Prophet está pronto para uso!")
        print(f"   ID do agente: {agent_id}")
        print("\n📝 Próximos passos:")
        print("   1. Recarregue a página do Agent Builder")
        print("   2. O Prophet agora será usado automaticamente como executor")
    else:
        print("\n❌ Falha ao instalar agente Prophet")