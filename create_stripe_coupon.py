#!/usr/bin/env python3
"""
Script para criar cupom de desconto de 80% no Stripe
Válido por 2 semanas a partir da criação
"""

import stripe
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('frontend/.env.local')

# Configurar API do Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def criar_cupom_desconto():
    """
    Cria um cupom de 80% de desconto no Stripe válido por 2 semanas
    """
    
    # Calcular data de expiração (2 semanas a partir de agora)
    expiracao = datetime.now() + timedelta(weeks=2)
    expiracao_timestamp = int(expiracao.timestamp())
    
    try:
        # Criar o cupom
        cupom = stripe.Coupon.create(
            percent_off=80,  # 80% de desconto
            duration="once",  # Desconto aplicado apenas uma vez
            name="Desconto Especial 80% - Prophet Pro",
            metadata={
                "description": "Cupom promocional de 80% de desconto",
                "created_by": "admin_script",
                "valid_for": "all_plans"  # Funciona para todos os planos
            },
            redeem_by=expiracao_timestamp  # Expira em 2 semanas
        )
        
        print("✅ Cupom criado com sucesso!")
        print("-" * 50)
        print(f"📌 ID do Cupom: {cupom.id}")
        print(f"💰 Desconto: {cupom.percent_off}%")
        print(f"⏰ Válido até: {datetime.fromtimestamp(cupom.redeem_by).strftime('%d/%m/%Y %H:%M')}")
        print(f"🔄 Duração: {cupom.duration}")
        print("-" * 50)
        
        # Criar um código promocional legível associado ao cupom
        codigo_promo = stripe.PromotionCode.create(
            coupon=cupom.id,
            code="PROPHET80",  # Código promocional fácil de lembrar
            metadata={
                "campaign": "special_promotion",
                "discount": "80_percent"
            }
        )
        
        print(f"🎟️ Código Promocional: {codigo_promo.code}")
        print("-" * 50)
        print("\n📝 Instruções de uso:")
        print("1. O cliente pode usar o código 'PROPHET80' no checkout")
        print("2. O desconto será aplicado automaticamente")
        print("3. Válido para qualquer plano (Pro Monthly, Pro Yearly, Pro Max Monthly, Pro Max Yearly)")
        print("4. Pode ser usado apenas uma vez por cliente")
        print(f"5. Expira em {datetime.fromtimestamp(cupom.redeem_by).strftime('%d/%m/%Y às %H:%M')}")
        
        return {
            "coupon_id": cupom.id,
            "promo_code": codigo_promo.code,
            "percent_off": cupom.percent_off,
            "expires_at": datetime.fromtimestamp(cupom.redeem_by).isoformat()
        }
        
    except stripe.error.StripeError as e:
        print(f"❌ Erro ao criar cupom: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Criando cupom de desconto no Stripe...")
    print("=" * 50)
    resultado = criar_cupom_desconto()
    
    if resultado:
        print("\n✨ Cupom criado e pronto para uso!")
        print("\n💡 Dica: Você pode verificar o cupom no dashboard do Stripe:")
        print("   https://dashboard.stripe.com/coupons")