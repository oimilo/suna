#!/usr/bin/env python3
"""
Script para sincronizar assinaturas do Stripe com o banco de dados.
Este script busca todas as assinaturas ativas no Stripe e as sincroniza
com a tabela billing_subscriptions do banco de dados.
"""

import stripe
import asyncio
import argparse
from datetime import datetime, timezone
from services.supabase import DBConnection
from utils.config import config
from utils.logger import logger
import sys

# Configurar Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

# Price IDs dos planos
PRICE_MAP = {
    'price_1RqK0hFNfWjTbEjsaAFuY7Cb': {'name': 'pro', 'amount': 9700},
    'price_1RqK0hFNfWjTbEjsN9XCGLA4': {'name': 'pro_yearly', 'amount': 97000},
    'price_1RqK4xFNfWjTbEjsCrjfvJVL': {'name': 'pro_max', 'amount': 29700},
    'price_1RqK6cFNfWjTbEjs75UPIgif': {'name': 'pro_max_yearly', 'amount': 297000}
}

async def get_account_id_from_customer(customer_id: str, email: str = None):
    """Busca o account_id (user_id) de um customer."""
    db = DBConnection()
    client = await db.client
    
    # Primeiro, buscar no billing_customers
    result = await client.schema('basejump').from_('billing_customers') \
        .select('account_id') \
        .eq('id', customer_id) \
        .execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]['account_id']
    
    # Se não encontrou e temos email, buscar usuário por email
    if email:
        users = await client.auth.admin.list_users()
        for user in users:
            if user.email == email:
                logger.info(f"Encontrado usuário {email} com ID {user.id}")
                
                # Criar billing_customer se não existir
                await client.schema('basejump').from_('billing_customers').insert({
                    'id': customer_id,
                    'account_id': user.id,
                    'email': email,
                    'provider': 'stripe',
                    'active': True
                }).execute()
                
                return user.id
    
    return None

async def sync_subscription(subscription):
    """Sincroniza uma assinatura do Stripe com o banco de dados."""
    db = DBConnection()
    client = await db.client
    
    try:
        customer_id = subscription['customer']
        
        # Buscar informações do customer no Stripe
        customer = stripe.Customer.retrieve(customer_id)
        email = customer.get('email')
        
        # Buscar account_id
        account_id = await get_account_id_from_customer(customer_id, email)
        
        if not account_id:
            logger.warning(f"Não foi possível encontrar account_id para customer {customer_id} ({email})")
            return False
        
        # Extrair informações da assinatura
        price_id = subscription['items']['data'][0]['price']['id'] if subscription['items']['data'] else None
        price_info = PRICE_MAP.get(price_id, {'name': 'unknown', 'amount': 0})
        
        # Preparar dados da assinatura
        subscription_data = {
            'id': subscription['id'],
            'account_id': account_id,
            'customer_id': customer_id,
            'status': subscription['status'],
            'price_id': price_id,
            'quantity': subscription['items']['data'][0]['quantity'] if subscription['items']['data'] else 1,
            'cancel_at_period_end': subscription['cancel_at_period_end'],
            'current_period_start': datetime.fromtimestamp(subscription['current_period_start'], tz=timezone.utc).isoformat(),
            'current_period_end': datetime.fromtimestamp(subscription['current_period_end'], tz=timezone.utc).isoformat(),
            'created': datetime.fromtimestamp(subscription['created'], tz=timezone.utc).isoformat(),
            'metadata': {
                'plan': price_info['name'],
                'synced_from_stripe': True,
                'synced_at': datetime.now(timezone.utc).isoformat()
            }
        }
        
        # Adicionar campos opcionais se existirem
        if subscription.get('trial_start'):
            subscription_data['trial_start'] = datetime.fromtimestamp(subscription['trial_start'], tz=timezone.utc).isoformat()
        if subscription.get('trial_end'):
            subscription_data['trial_end'] = datetime.fromtimestamp(subscription['trial_end'], tz=timezone.utc).isoformat()
        if subscription.get('canceled_at'):
            subscription_data['canceled_at'] = datetime.fromtimestamp(subscription['canceled_at'], tz=timezone.utc).isoformat()
        if subscription.get('ended_at'):
            subscription_data['ended_at'] = datetime.fromtimestamp(subscription['ended_at'], tz=timezone.utc).isoformat()
        
        # Verificar se a assinatura já existe
        existing = await client.from_('billing_subscriptions') \
            .select('id') \
            .eq('id', subscription['id']) \
            .execute()
        
        if existing.data and len(existing.data) > 0:
            # Atualizar assinatura existente
            await client.from_('billing_subscriptions') \
                .update(subscription_data) \
                .eq('id', subscription['id']) \
                .execute()
            logger.info(f"Assinatura {subscription['id']} atualizada para {email} ({price_info['name']})")
        else:
            # Criar nova assinatura
            await client.from_('billing_subscriptions') \
                .insert(subscription_data) \
                .execute()
            logger.info(f"Assinatura {subscription['id']} criada para {email} ({price_info['name']})")
        
        # Verificar/criar billing_price se não existir
        if price_id:
            price_exists = await client.from_('billing_prices') \
                .select('id') \
                .eq('id', price_id) \
                .execute()
            
            if not price_exists.data:
                # Buscar informações do price no Stripe
                stripe_price = stripe.Price.retrieve(price_id)
                
                price_data = {
                    'id': price_id,
                    'product_id': stripe_price['product'],
                    'active': stripe_price['active'],
                    'type': stripe_price['type'],
                    'amount': stripe_price['unit_amount'],
                    'currency': stripe_price['currency'],
                    'interval': stripe_price.get('recurring', {}).get('interval', 'month'),
                    'interval_count': stripe_price.get('recurring', {}).get('interval_count', 1),
                    'metadata': stripe_price.get('metadata', {})
                }
                
                await client.from_('billing_prices') \
                    .insert(price_data) \
                    .execute()
                logger.info(f"Price {price_id} criado no banco")
        
        return True
        
    except Exception as e:
        logger.error(f"Erro ao sincronizar assinatura {subscription['id']}: {e}")
        return False

async def sync_all_subscriptions(dry_run=False):
    """Sincroniza todas as assinaturas ativas do Stripe."""
    try:
        logger.info("Buscando todas as assinaturas ativas no Stripe...")
        
        # Buscar todas as assinaturas ativas
        subscriptions = stripe.Subscription.list(
            status='active',
            limit=100,
            expand=['data.customer']
        )
        
        total = len(subscriptions.data)
        logger.info(f"Encontradas {total} assinaturas ativas no Stripe")
        
        if dry_run:
            logger.info("Modo DRY RUN - apenas listando assinaturas:")
            for sub in subscriptions.data:
                customer = sub.customer
                email = customer.email if hasattr(customer, 'email') else 'N/A'
                price_id = sub['items']['data'][0]['price']['id'] if sub['items']['data'] else 'N/A'
                plan = PRICE_MAP.get(price_id, {}).get('name', 'unknown')
                
                print(f"  - {email}: {plan} (ID: {sub['id']})")
            return
        
        # Sincronizar cada assinatura
        success_count = 0
        for sub in subscriptions.data:
            if await sync_subscription(sub):
                success_count += 1
        
        logger.info(f"Sincronização concluída: {success_count}/{total} assinaturas sincronizadas")
        
        # Verificar se específicos usuários foram sincronizados
        target_emails = [
            'start@prophet.build',
            'claudio.ferreira@trademaster.com.br',
            'cavallari@neurociente.com.br',
            'vinicius@agenciadebolso.com'
        ]
        
        db = DBConnection()
        client = await db.client
        
        logger.info("\nVerificando usuários específicos:")
        for email in target_emails:
            # Buscar usuário
            users = await client.auth.admin.list_users()
            user = next((u for u in users if u.email == email), None)
            
            if user:
                # Verificar assinatura
                result = await client.from_('billing_subscriptions') \
                    .select('*') \
                    .eq('account_id', user.id) \
                    .eq('status', 'active') \
                    .execute()
                
                if result.data:
                    logger.info(f"  ✅ {email}: Assinatura encontrada")
                else:
                    logger.warning(f"  ❌ {email}: Sem assinatura ativa no banco")
            else:
                logger.warning(f"  ❌ {email}: Usuário não encontrado")
        
    except Exception as e:
        logger.error(f"Erro ao sincronizar assinaturas: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Sincroniza assinaturas do Stripe com o banco de dados')
    parser.add_argument('--dry-run', action='store_true', help='Apenas lista as assinaturas, sem sincronizar')
    
    args = parser.parse_args()
    
    print(f"🔧 Usando Stripe API: {config.STRIPE_SECRET_KEY[:20]}...")
    print(f"🌍 Ambiente: {config.ENV_MODE}\n")
    
    asyncio.run(sync_all_subscriptions(dry_run=args.dry_run))

if __name__ == '__main__':
    main()