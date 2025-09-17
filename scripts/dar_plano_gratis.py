#!/usr/bin/env python3
"""
Script amigável para dar planos gratuitos para usuários do Prophet/Suna
Autor: Sistema Prophet
Data: 2025-01-30
"""

import sys
import os
import stripe
from datetime import datetime, timezone
# Cores simples sem dependências
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    RESET = '\033[0m'

Fore = Colors()

# Add backend directory to path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_path)

# Load environment variables
from dotenv import load_dotenv
env_path = os.path.join(backend_path, '.env.local')
load_dotenv(env_path)

# Import after loading env
from utils.config import config
from services.supabase import DBConnection
import asyncio

# Planos disponíveis com descrições amigáveis
PLANOS = {
    '1': {
        'id': 'price_1RqK0hFNfWjTbEjsaAFuY7Cb',
        'nome': 'Pro Mensal',
        'descricao': 'R$99/mês - Acesso a modelos premium',
        'alias': 'pro'
    },
    '2': {
        'id': 'price_1RqK0hFNfWjTbEjsN9XCGLA4',
        'nome': 'Pro Anual',
        'descricao': 'R$990/ano - Economia de 2 meses',
        'alias': 'pro_yearly'
    },
    '3': {
        'id': 'price_1RqK4xFNfWjTbEjsCrjfvJVL',
        'nome': 'Pro Max Mensal',
        'descricao': 'R$249/mês - Limites expandidos',
        'alias': 'pro_max'
    },
    '4': {
        'id': 'price_1RqK6cFNfWjTbEjs75UPIgif',
        'nome': 'Pro Max Anual',
        'descricao': 'R$2490/ano - Melhor custo-benefício',
        'alias': 'pro_max_yearly'
    }
}

def print_header():
    """Imprime cabeçalho bonito"""
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}🎁 DAR PLANO GRATUITO - PROPHET/SUNA")
    print(f"{Fore.CYAN}{'='*60}\n")

def print_success(message):
    """Imprime mensagem de sucesso"""
    print(f"{Fore.GREEN}✅ {message}")

def print_error(message):
    """Imprime mensagem de erro"""
    print(f"{Fore.RED}❌ {message}")

def print_info(message):
    """Imprime mensagem informativa"""
    print(f"{Fore.YELLOW}ℹ️  {message}")

def print_planos():
    """Mostra os planos disponíveis"""
    print(f"{Fore.MAGENTA}Planos disponíveis:\n")
    for key, plano in PLANOS.items():
        print(f"  {Fore.WHITE}[{key}] {Fore.CYAN}{plano['nome']} {Fore.GRAY}- {plano['descricao']}")
    print()

def get_user_input():
    """Coleta informações do usuário de forma interativa"""
    print_header()
    
    # Email do usuário
    print(f"{Fore.YELLOW}📧 Digite o email do usuário:")
    email = input(f"{Fore.WHITE}→ ").strip()
    
    if not email or '@' not in email:
        print_error("Email inválido!")
        return None, None, None
    
    # Mostrar planos
    print(f"\n{Fore.YELLOW}📋 Escolha o plano:")
    print_planos()
    
    escolha = input(f"{Fore.YELLOW}Digite o número do plano [1-4]: {Fore.WHITE}").strip()
    
    if escolha not in PLANOS:
        print_error("Opção inválida!")
        return None, None, None
    
    plano = PLANOS[escolha]
    
    # Duração em meses
    print(f"\n{Fore.YELLOW}📅 Por quantos meses o plano será gratuito?")
    print(f"{Fore.GRAY}(Digite 0 para indefinido)")
    
    try:
        meses = int(input(f"{Fore.WHITE}→ ").strip() or "1")
        if meses < 0:
            raise ValueError
    except ValueError:
        print_error("Número de meses inválido!")
        return None, None, None
    
    # Confirmação
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.WHITE}Confirmar dados:")
    print(f"  Email: {Fore.GREEN}{email}")
    print(f"  Plano: {Fore.GREEN}{plano['nome']}")
    print(f"  Duração: {Fore.GREEN}{meses if meses > 0 else 'Indefinido'} {'meses' if meses != 1 else 'mês'}")
    print(f"{Fore.CYAN}{'='*60}")
    
    confirma = input(f"\n{Fore.YELLOW}Confirmar? [S/n]: {Fore.WHITE}").strip().lower()
    
    if confirma == 'n':
        print_info("Operação cancelada.")
        return None, None, None
    
    return email, plano['id'], meses

async def vincular_customer_supabase(email: str, customer_id: str):
    """Vincula o customer do Stripe no Supabase"""
    try:
        db = DBConnection()
        client = await db.client
        
        # Buscar user_id pelo email
        user_result = await client.auth.admin.list_users()
        user_id = None
        
        for user in user_result:
            if user.email == email:
                user_id = user.id
                break
        
        if not user_id:
            print_error(f"Usuário não encontrado no Supabase: {email}")
            return False
        
        # Verificar se já existe
        existing = await client.schema('basejump').from_('billing_customers') \
            .select('id') \
            .eq('account_id', user_id) \
            .execute()
        
        if existing.data:
            # Atualizar
            await client.schema('basejump').from_('billing_customers') \
                .update({'id': customer_id, 'active': True}) \
                .eq('account_id', user_id) \
                .execute()
            print_info("Customer atualizado no Supabase")
        else:
            # Inserir
            await client.schema('basejump').from_('billing_customers') \
                .insert({
                    'id': customer_id,
                    'account_id': user_id,
                    'email': email,
                    'provider': 'stripe',
                    'active': True
                }) \
                .execute()
            print_info("Customer vinculado no Supabase")
        
        return True
        
    except Exception as e:
        print_error(f"Erro ao vincular no Supabase: {str(e)}")
        return False

def dar_plano_gratis(email: str, price_id: str, meses: int = 1):
    """Cria assinatura com 100% de desconto"""
    # Initialize Stripe
    stripe.api_key = config.STRIPE_SECRET_KEY
    
    try:
        print_info("Conectando ao Stripe...")
        
        # Buscar cliente existente
        customers = stripe.Customer.list(email=email, limit=1)
        
        if customers.data:
            customer = customers.data[0]
            print_success(f"Cliente encontrado: {customer.id}")
            # Vincular no Supabase (caso não esteja vinculado)
            asyncio.run(vincular_customer_supabase(email, customer.id))
        else:
            # Criar novo cliente
            customer = stripe.Customer.create(
                email=email,
                metadata={
                    "manual_assignment": "true",
                    "assigned_by": "dar_plano_gratis.py"
                }
            )
            print_success(f"Cliente criado: {customer.id}")
        
        # Vincular no Supabase
        asyncio.run(vincular_customer_supabase(email, customer.id))
        
        # Criar cupom de 100% de desconto
        if meses > 0:
            coupon = stripe.Coupon.create(
                percent_off=100,
                duration="repeating",
                duration_in_months=meses,
                name=f"Grátis - {email[:20]}",
                metadata={
                    "manual_assignment": "true",
                    "assigned_by": "dar_plano_gratis.py"
                }
            )
        else:
            # Cupom permanente
            coupon = stripe.Coupon.create(
                percent_off=100,
                duration="forever",
                name=f"Permanente - {email[:20]}",
                metadata={
                    "manual_assignment": "true",
                    "assigned_by": "dar_plano_gratis.py"
                }
            )
        
        print_success(f"Cupom de desconto criado: {coupon.id}")
        
        # Verificar assinaturas existentes
        subscriptions = stripe.Subscription.list(
            customer=customer.id,
            status="active",
            limit=10
        )
        
        # Cancelar assinaturas existentes se houver
        if subscriptions.data:
            print_info(f"Encontradas {len(subscriptions.data)} assinaturas ativas")
            for sub in subscriptions.data:
                stripe.Subscription.cancel(sub.id)
                print_info(f"Assinatura anterior cancelada: {sub.id}")
        
        # Criar nova assinatura
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price_id}],
            discounts=[{"coupon": coupon.id}],
            metadata={
                "manual_assignment": "true",
                "assigned_by": "dar_plano_gratis.py",
                "assigned_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        print_success(f"Assinatura criada: {subscription.id}")
        
        # Obter detalhes do plano
        price = stripe.Price.retrieve(price_id)
        product = stripe.Product.retrieve(price.product)
        
        # Resumo final
        print(f"\n{Fore.GREEN}{'='*60}")
        print(f"{Fore.GREEN}🎉 PLANO ATIVADO COM SUCESSO!")
        print(f"{Fore.GREEN}{'='*60}")
        print(f"\n{Fore.WHITE}📋 Resumo:")
        print(f"  Usuário: {Fore.CYAN}{email}")
        print(f"  Plano: {Fore.CYAN}{product.name}")
        print(f"  Status: {Fore.GREEN}{subscription.status.upper()}")
        print(f"  Gratuito por: {Fore.CYAN}{meses if meses > 0 else 'Sempre'} {'meses' if meses != 1 else 'mês'}")
        
        if subscription.get('current_period_end'):
            data_fim = datetime.fromtimestamp(
                subscription['current_period_end'], 
                tz=timezone.utc
            ).strftime('%d/%m/%Y')
            print(f"  Válido até: {Fore.CYAN}{data_fim}")
        
        print(f"\n{Fore.GRAY}ID do Cliente: {customer.id}")
        print(f"{Fore.GRAY}ID da Assinatura: {subscription.id}")
        
        return True
        
    except stripe.error.StripeError as e:
        print_error(f"Erro do Stripe: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Erro inesperado: {str(e)}")
        return False

def main():
    """Função principal"""
    # Se passou argumentos via linha de comando
    if len(sys.argv) > 1:
        # Modo linha de comando
        if len(sys.argv) < 3:
            print_error("Uso: python dar_plano_gratis.py <email> <plano> [meses]")
            print("\nPlanos disponíveis:")
            for plano in PLANOS.values():
                print(f"  {plano['alias']}: {plano['nome']}")
            sys.exit(1)
        
        email = sys.argv[1]
        plano_alias = sys.argv[2]
        meses = int(sys.argv[3]) if len(sys.argv) > 3 else 1
        
        # Encontrar plano por alias
        price_id = None
        for plano in PLANOS.values():
            if plano['alias'] == plano_alias:
                price_id = plano['id']
                break
        
        if not price_id:
            print_error(f"Plano '{plano_alias}' não encontrado!")
            sys.exit(1)
        
        dar_plano_gratis(email, price_id, meses)
    else:
        # Modo interativo
        email, price_id, meses = get_user_input()
        
        if email and price_id is not None:
            print()
            dar_plano_gratis(email, price_id, meses)
        else:
            print_info("Operação cancelada.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Operação cancelada pelo usuário.")
    except Exception as e:
        print_error(f"Erro fatal: {str(e)}")