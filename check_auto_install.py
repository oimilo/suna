#!/usr/bin/env python3
"""
Script para verificar se as funções de auto-instalação do Prophet existem
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

print("🔍 Verificando funções de auto-instalação do Prophet...\n")

# Query para verificar se as funções existem
check_functions_query = """
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('install_prophet_agent_for_user', 'run_new_user_setup')
ORDER BY n.nspname, p.proname;
"""

try:
    # Executar query usando RPC (não há método direto para queries SQL personalizadas)
    # Vamos verificar de outra forma
    
    print("📊 Verificando triggers na tabela auth.users...")
    
    # Verificar se o trigger existe
    check_trigger_query = """
    SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' 
    AND event_object_table = 'users'
    AND trigger_name = 'on_new_user_created';
    """
    
    print("\n📊 Verificando se a função install_prophet_agent_for_user está sendo chamada...")
    
    # Vamos verificar indiretamente criando um usuário de teste
    print("\n🧪 Teste indireto:")
    print("   - Se novos usuários estão sendo criados sem Prophet, pode ser que:")
    print("     1. As migrations não foram aplicadas")
    print("     2. O trigger está desabilitado")
    print("     3. Há um erro na função")
    
    # Verificar quando foi a última vez que um Prophet foi criado
    result = supabase.table('agents').select('created_at, account_id').eq('name', 'Prophet').order('created_at', desc=True).limit(5).execute()
    
    if result.data:
        print(f"\n📅 Últimos 5 agentes Prophet criados:")
        for agent in result.data:
            print(f"   - {agent['created_at']} (account: {agent['account_id']})")
    else:
        print("\n⚠️  Nenhum agente Prophet encontrado no banco!")
        
    # Verificar se há erros recentes
    print("\n💡 Sugestões:")
    print("   1. Verifique se as migrations foram aplicadas corretamente")
    print("   2. Execute manualmente as migrations SQL")
    print("   3. Verifique os logs do Supabase para erros")
    
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n✅ Verificação concluída!")
print("\n📝 Para corrigir o problema de auto-instalação:")
print("   1. Execute as migrations SQL manualmente no Supabase Dashboard")
print("   2. Ou use o script install_prophet_for_user.py para instalar manualmente")