#!/usr/bin/env python3
"""
Script para criar subscriptions REAIS no Stripe com cupom de 100% desconto.
Funciona em produção!
"""

import stripe
import asyncio
import argparse
from datetime import datetime
from services.supabase import DBConnection
from utils.config import config
from utils.logger import logger
import sys

# Configurar Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

# Price IDs oficiais
PRICE_IDS = {
    'pro': config.STRIPE_PRO_MONTHLY_ID,  # price_1RqK0hFNfWjTbEjsaAFuY7Cb
    'pro_yearly': config.STRIPE_PRO_YEARLY_ID,  # price_1RqK0hFNfWjTbEjsN9XCGLA4
    'pro_max': config.STRIPE_PRO_MAX_MONTHLY_ID,  # price_1RqK4xFNfWjTbEjsCrjfvJVL
    'pro_max_yearly': config.STRIPE_PRO_MAX_YEARLY_ID,  # price_1RqK6cFNfWjTbEjs75UPIgif
}

async def get_user_by_email(email: str):
    """Busca usuário por email no Supabase."""
    db = DBConnection()
    client = await db.client
    
    try:
        # Usar a API admin para buscar usuário
        users = await client.auth.admin.list_users()
        for user in users:
            if user.email == email:
                return user
        return None
    except Exception as e:
        logger.error(f"Erro ao buscar usuário: {e}")
        return None

async def get_or_create_stripe_customer(user_id: str, email: str):
    """Obtém ou cria um customer no Stripe."""
    db = DBConnection()
    client = await db.client
    
    # Verificar se já existe customer
    result = await client.schema('basejump').from_('billing_customers') \
        .select('id') \
        .eq('account_id', user_id) \
        .execute()
    
    if result.data and len(result.data) > 0:
        customer_id = result.data[0]['id']
        
        # Verificar se é um customer de teste/desenvolvimento
        if customer_id.startswith(('cus_test_', 'cus_dev_', 'cus_manual_')):
            logger.info(f"Customer de teste encontrado: {customer_id}, deletando...")
            
            # Deletar subscriptions associadas
            await client.schema('basejump').from_('billing_subscriptions') \
                .delete() \
                .eq('billing_customer_id', customer_id) \
                .execute()
            
            # Deletar customer
            await client.schema('basejump').from_('billing_customers') \
                .delete() \
                .eq('id', customer_id) \
                .execute()
        else:
            # Verificar se customer existe no Stripe
            try:
                stripe_customer = stripe.Customer.retrieve(customer_id)
                logger.info(f"Customer Stripe válido encontrado: {customer_id}")
                return customer_id
            except stripe.error.InvalidRequestError:
                logger.warning(f"Customer {customer_id} não existe no Stripe, deletando do banco...")
                
                # Deletar subscriptions associadas
                await client.schema('basejump').from_('billing_subscriptions') \
                    .delete() \
                    .eq('billing_customer_id', customer_id) \
                    .execute()
                
                # Deletar customer
                await client.schema('basejump').from_('billing_customers') \
                    .delete() \
                    .eq('id', customer_id) \
                    .execute()
    
    # Criar novo customer no Stripe
    customer = stripe.Customer.create(
        email=email,
        metadata={"user_id": user_id}
    )
    
    # Salvar no banco
    await client.schema('basejump').from_('billing_customers').insert({
        'id': customer.id,
        'account_id': user_id,
        'email': email,
        'provider': 'stripe',
        'active': True
    }).execute()
    
    logger.info(f"Novo customer criado no Stripe: {customer.id}")
    return customer.id

def create_or_get_coupon(duration_months=None):
    """Cria ou obtém um cupom de 100% desconto."""
    if duration_months:
        coupon_id = f"PROPHET_TEST_100_OFF_{duration_months}M"
        duration = "repeating"
        duration_in_months = duration_months
    else:
        coupon_id = "PROPHET_TEST_100_OFF"
        duration = "forever"
        duration_in_months = None
    
    try:
        # Tentar buscar cupom existente
        coupon = stripe.Coupon.retrieve(coupon_id)
        logger.info(f"Cupom existente encontrado: {coupon_id}")
        return coupon_id
    except stripe.error.InvalidRequestError:
        # Criar novo cupom
        create_params = {
            "id": coupon_id,
            "percent_off": 100,
            "duration": duration,
            "name": f"Prophet Test 100% Off {f'{duration_months} month' if duration_months else 'Forever'}",
            "metadata": {"purpose": "test_subscriptions"}
        }
        if duration_in_months:
            create_params["duration_in_months"] = duration_in_months
            
        coupon = stripe.Coupon.create(**create_params)
        logger.info(f"Novo cupom criado: {coupon_id}")
        return coupon_id

async def create_subscription(email: str, plan: str, duration_months=None):
    """Cria uma subscription real no Stripe com 100% desconto."""
    
    # Validar plano
    if plan not in PRICE_IDS:
        print(f"❌ Plano '{plan}' inválido. Use: {', '.join(PRICE_IDS.keys())}")
        return False
    
    price_id = PRICE_IDS[plan]
    
    # Buscar usuário
    user = await get_user_by_email(email)
    if not user:
        print(f"❌ Usuário com email '{email}' não encontrado")
        return False
    
    user_id = str(user.id)
    
    try:
        # Obter ou criar customer
        customer_id = await get_or_create_stripe_customer(user_id, email)
        
        # Cancelar subscriptions existentes
        existing_subs = stripe.Subscription.list(
            customer=customer_id,
            status='active'
        )
        
        for sub in existing_subs.data:
            stripe.Subscription.delete(sub.id)
            logger.info(f"Subscription existente cancelada: {sub.id}")
        
        # Obter ou criar cupom
        coupon_id = create_or_get_coupon(duration_months)
        
        # Criar nova subscription
        subscription = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            discounts=[{"coupon": coupon_id}],
            metadata={
                "test_subscription": "true",
                "created_by_script": "true",
                "created_at": datetime.now().isoformat(),
                "duration_months": str(duration_months) if duration_months else "unlimited"
            }
        )
        
        print(f"✅ Subscription criada com sucesso!")
        print(f"   Email: {email}")
        print(f"   Plano: {plan}")
        print(f"   Subscription ID: {subscription.id}")
        print(f"   Status: {subscription.status}")
        print(f"   Customer ID: {customer_id}")
        print(f"   Cupom aplicado: 100% desconto{f' por {duration_months} mês(es)' if duration_months else ' (permanente)'}")
        if hasattr(subscription, 'current_period_start') and hasattr(subscription, 'current_period_end'):
            print(f"   Período: {datetime.fromtimestamp(subscription.current_period_start).strftime('%Y-%m-%d')} até {datetime.fromtimestamp(subscription.current_period_end).strftime('%Y-%m-%d')}")
        
        print("\n🎉 A subscription foi criada com sucesso no Stripe!")
        print("   Você pode verificar em: https://dashboard.stripe.com/subscriptions")
        
        return True
        
    except stripe.error.StripeError as e:
        print(f"❌ Erro do Stripe: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        logger.error(f"Erro ao criar subscription: {e}")
        return False

async def remove_subscription(email: str):
    """Remove subscription de um usuário."""
    user = await get_user_by_email(email)
    if not user:
        print(f"❌ Usuário com email '{email}' não encontrado")
        return False
    
    user_id = str(user.id)
    db = DBConnection()
    client = await db.client
    
    # Buscar customer
    result = await client.schema('basejump').from_('billing_customers') \
        .select('id') \
        .eq('account_id', user_id) \
        .execute()
    
    if not result.data:
        print(f"✅ Usuário {email} já está no plano FREE (sem customer)")
        return True
    
    customer_id = result.data[0]['id']
    
    try:
        # Cancelar todas as subscriptions no Stripe
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status='all'
        )
        
        for sub in subscriptions.data:
            if sub.status != 'canceled':
                stripe.Subscription.delete(sub.id)
                print(f"   Cancelada subscription: {sub.id}")
        
        print(f"✅ Usuário {email} configurado para plano FREE")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao remover subscription: {e}")
        return False

async def list_subscriptions():
    """Lista todas as subscriptions com cupom de teste."""
    try:
        # Buscar todas as subscriptions com nosso cupom
        subscriptions = stripe.Subscription.list(
            limit=100,
            expand=['data.customer']
        )
        
        test_subs = []
        for sub in subscriptions.data:
            # Verificar se tem nosso cupom ou metadata de teste
            has_test_discount = False
            if hasattr(sub, 'discount') and sub.discount:
                if hasattr(sub.discount, 'coupon') and sub.discount.coupon.id == "PROPHET_TEST_100_OFF":
                    has_test_discount = True
            
            if has_test_discount or (sub.metadata.get("test_subscription") == "true"):
                test_subs.append(sub)
        
        if not test_subs:
            print("Nenhuma subscription de teste encontrada.")
            return
        
        print("\n📋 Subscriptions de Teste (com 100% desconto):")
        print("-" * 80)
        
        for sub in test_subs:
            customer = sub.customer
            email = customer.email if hasattr(customer, 'email') else 'N/A'
            
            # Determinar nome do plano
            price_id = sub.items.data[0].price.id if hasattr(sub.items, 'data') and sub.items.data else 'N/A'
            plan_name = 'Unknown'
            for plan, pid in PRICE_IDS.items():
                if pid == price_id:
                    plan_name = plan.replace('_', ' ').title()
                    break
            
            print(f"Email: {email}")
            print(f"  Customer ID: {sub.customer.id if hasattr(sub, 'customer') else sub.customer}")
            print(f"  Subscription ID: {sub.id}")
            print(f"  Plano: {plan_name}")
            print(f"  Status: {sub.status}")
            print(f"  Criado em: {datetime.fromtimestamp(sub.created).strftime('%Y-%m-%d %H:%M')}")
            print(f"  Período atual até: {datetime.fromtimestamp(sub.current_period_end).strftime('%Y-%m-%d')}")
            print("-" * 80)
            
    except Exception as e:
        print(f"❌ Erro ao listar subscriptions: {e}")

def main():
    parser = argparse.ArgumentParser(description='Criar subscriptions REAIS no Stripe com 100% desconto')
    
    subparsers = parser.add_subparsers(dest='command', help='Comandos disponíveis')
    
    # Comando create
    create_parser = subparsers.add_parser('create', help='Cria subscription para um usuário')
    create_parser.add_argument('email', help='Email do usuário')
    create_parser.add_argument('plan', choices=['pro', 'pro_yearly', 'pro_max', 'pro_max_yearly'], 
                              help='Plano a ser atribuído')
    create_parser.add_argument('--duration', type=int, metavar='MONTHS',
                              help='Duração em meses (ex: 1 para um mês, 3 para três meses). Sem este parâmetro, a subscription é permanente.')
    
    # Comando remove
    remove_parser = subparsers.add_parser('remove', help='Remove subscription (volta para FREE)')
    remove_parser.add_argument('email', help='Email do usuário')
    
    # Comando list
    subparsers.add_parser('list', help='Lista todas as subscriptions de teste')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    print(f"🔧 Usando Stripe API: {config.STRIPE_SECRET_KEY[:20]}...")
    print(f"🌍 Ambiente: {config.ENV_MODE}\n")
    
    # Executar comando
    if args.command == 'create':
        asyncio.run(create_subscription(args.email, args.plan, args.duration))
    elif args.command == 'remove':
        asyncio.run(remove_subscription(args.email))
    elif args.command == 'list':
        asyncio.run(list_subscriptions())

if __name__ == '__main__':
    main()