#!/usr/bin/env python3
"""
Script para gerenciar subscriptions de teste para o Prophet.
Este script cria subscriptions diretamente no banco de dados para testes locais.

IMPORTANTE: Essas subscriptions NÃO aparecerão no Stripe, apenas no banco local.
Para que funcionem, o código precisa ser modificado para buscar no banco local
quando não encontrar no Stripe.
"""

import asyncio
import argparse
from datetime import datetime, timezone, timedelta
from services.supabase import DBConnection
from utils.logger import logger
import sys
import uuid

# Price IDs oficiais
PRICE_IDS = {
    'free': None,
    'pro': 'price_1RqK0hFNfWjTbEjsaAFuY7Cb',  # Pro Monthly
    'pro_yearly': 'price_1RqK0hFNfWjTbEjsN9XCGLA4',  # Pro Yearly
    'pro_max': 'price_1RqK4xFNfWjTbEjsCrjfvJVL',  # Pro Max Monthly
    'pro_max_yearly': 'price_1RqK6cFNfWjTbEjs75UPIgif',  # Pro Max Yearly
}

async def get_user_by_email(client, email: str):
    """Busca usuário por email."""
    try:
        user_result = await client.auth.admin.list_users()
        for user in user_result:
            if user.email == email:
                return user
        return None
    except Exception as e:
        logger.error(f"Erro ao buscar usuário: {e}")
        return None

async def set_user_plan(email: str, plan: str, months: int = 1):
    """Define o plano de um usuário."""
    db = DBConnection()
    client = await db.client
    
    # Buscar usuário
    user = await get_user_by_email(client, email)
    if not user:
        print(f"❌ Usuário com email '{email}' não encontrado")
        return False
    
    user_id = str(user.id)
    
    # Para plano free, remover subscription
    if plan == 'free':
        # Buscar customer
        customer_result = await client.schema('basejump').from_('billing_customers') \
            .select('id') \
            .eq('account_id', user_id) \
            .execute()
        
        if customer_result.data:
            customer_id = customer_result.data[0]['id']
            
            # Deletar subscriptions
            await client.schema('basejump').from_('billing_subscriptions') \
                .delete() \
                .eq('customer_id', customer_id) \
                .execute()
            
            print(f"✅ Usuário {email} configurado para plano FREE")
            return True
        else:
            print(f"✅ Usuário {email} já está no plano FREE")
            return True
    
    # Para outros planos, criar/atualizar subscription
    price_id = PRICE_IDS.get(plan)
    if not price_id:
        print(f"❌ Plano '{plan}' não reconhecido. Use: {', '.join(PRICE_IDS.keys())}")
        return False
    
    # Verificar/criar customer
    customer_result = await client.schema('basejump').from_('billing_customers') \
        .select('id') \
        .eq('account_id', user_id) \
        .execute()
    
    if customer_result.data:
        customer_id = customer_result.data[0]['id']
    else:
        # Criar customer
        customer_id = f"cus_test_{uuid.uuid4().hex[:14]}"
        
        await client.schema('basejump').from_('billing_customers').insert({
            'id': customer_id,
            'account_id': user_id,
            'email': email,
            'provider': 'stripe',
            'active': True
        }).execute()
        
        print(f"📝 Criado customer de teste: {customer_id}")
    
    # Deletar subscriptions antigas
    await client.schema('basejump').from_('billing_subscriptions') \
        .delete() \
        .eq('customer_id', customer_id) \
        .execute()
    
    # Criar nova subscription
    subscription_id = f"sub_test_{uuid.uuid4().hex[:20]}"
    current_time = datetime.now(timezone.utc)
    period_end = current_time + timedelta(days=30 * months)
    
    await client.schema('basejump').from_('billing_subscriptions').insert({
        'id': subscription_id,
        'customer_id': customer_id,
        'status': 'active',
        'price_id': price_id,
        'quantity': 1,
        'current_period_start': current_time.isoformat(),
        'current_period_end': period_end.isoformat(),
        'cancel_at_period_end': False,
        'created': current_time.isoformat(),
        'metadata': {
            'test_subscription': True,
            'created_by_script': True,
            'created_at': current_time.isoformat()
        }
    }).execute()
    
    plan_name = plan.replace('_', ' ').title()
    print(f"✅ Usuário {email} configurado para plano {plan_name} por {months} mês(es)")
    print(f"   Subscription ID: {subscription_id}")
    print(f"   Válido até: {period_end.strftime('%Y-%m-%d')}")
    
    return True

async def list_subscriptions():
    """Lista todas as subscriptions de teste."""
    db = DBConnection()
    client = await db.client
    
    result = await client.schema('basejump').from_('billing_subscriptions') \
        .select('*, billing_customers!inner(email, account_id)') \
        .like('id', 'sub_test_%') \
        .eq('status', 'active') \
        .execute()
    
    if not result.data:
        print("Nenhuma subscription de teste encontrada.")
        return
    
    print("\n📋 Subscriptions de Teste Ativas:")
    print("-" * 80)
    
    for sub in result.data:
        email = sub['billing_customers']['email']
        price_id = sub['price_id']
        end_date = datetime.fromisoformat(sub['current_period_end'].replace('Z', '+00:00'))
        
        # Determinar nome do plano
        plan_name = 'Unknown'
        for plan, pid in PRICE_IDS.items():
            if pid == price_id:
                plan_name = plan.replace('_', ' ').title()
                break
        
        print(f"Email: {email}")
        print(f"  Plano: {plan_name}")
        print(f"  Price ID: {price_id}")
        print(f"  Válido até: {end_date.strftime('%Y-%m-%d %H:%M')}")
        print(f"  Subscription ID: {sub['id']}")
        print("-" * 80)

async def cleanup_test_subscriptions():
    """Remove todas as subscriptions de teste."""
    db = DBConnection()
    client = await db.client
    
    # Deletar subscriptions de teste
    result = await client.schema('basejump').from_('billing_subscriptions') \
        .delete() \
        .like('id', 'sub_test_%') \
        .execute()
    
    # Deletar customers de teste sem subscriptions
    await client.schema('basejump').from_('billing_customers') \
        .delete() \
        .like('id', 'cus_test_%') \
        .execute()
    
    print("✅ Todas as subscriptions de teste foram removidas")

def main():
    parser = argparse.ArgumentParser(description='Gerenciar subscriptions de teste do Prophet')
    
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponíveis')
    
    # Comando set
    set_parser = subparsers.add_parser('set', help='Define o plano de um usuário')
    set_parser.add_argument('email', help='Email do usuário')
    set_parser.add_argument('plan', choices=['free', 'pro', 'pro_yearly', 'pro_max', 'pro_max_yearly'], 
                          help='Plano a ser atribuído')
    set_parser.add_argument('--months', type=int, default=1, 
                          help='Duração em meses (padrão: 1)')
    
    # Comando list
    subparsers.add_parser('list', help='Lista todas as subscriptions de teste')
    
    # Comando cleanup
    subparsers.add_parser('cleanup', help='Remove todas as subscriptions de teste')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Executar comando
    if args.command == 'set':
        asyncio.run(set_user_plan(args.email, args.plan, args.months))
    elif args.command == 'list':
        asyncio.run(list_subscriptions())
    elif args.command == 'cleanup':
        asyncio.run(cleanup_test_subscriptions())

if __name__ == '__main__':
    main()