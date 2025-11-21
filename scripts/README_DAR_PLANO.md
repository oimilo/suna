# 🎁 Script para Dar Planos Gratuitos

Este script permite dar planos gratuitos para qualquer usuário do Prophet/Prophet usando o Stripe com cupom de 100% de desconto.

## 📋 Como Usar

### Modo Interativo (Recomendado)
```bash
cd scripts
python dar_plano_gratis.py
```

O script irá perguntar:
1. Email do usuário
2. Qual plano dar
3. Por quantos meses será gratuito

### Modo Linha de Comando
```bash
python dar_plano_gratis.py <email> <plano> [meses]
```

**Exemplos:**
```bash
# Dar Pro por 3 meses
python dar_plano_gratis.py usuario@email.com pro 3

# Dar Pro Max por 12 meses
python dar_plano_gratis.py usuario@email.com pro_max 12

# Dar Pro Max permanente (0 = indefinido)
python dar_plano_gratis.py usuario@email.com pro_max 0
```

## 🎯 Planos Disponíveis

| Alias | Nome | Valor Normal |
|-------|------|--------------|
| `pro` | Pro Mensal | R$99/mês |
| `pro_yearly` | Pro Anual | R$990/ano |
| `pro_max` | Pro Max Mensal | R$249/mês |
| `pro_max_yearly` | Pro Max Anual | R$2490/ano |

## ⚡ Funcionalidades

- ✅ Interface colorida e amigável
- ✅ Cancela assinaturas anteriores automaticamente
- ✅ Cria cupom de 100% de desconto
- ✅ Suporta planos temporários ou permanentes
- ✅ Mostra resumo completo após ativação

## 🔧 Como Funciona

1. **Busca/Cria Cliente**: Verifica se o usuário já existe no Stripe ou cria um novo
2. **Cria Cupom**: Gera um cupom de 100% de desconto válido por X meses
3. **Cancela Antigas**: Remove assinaturas anteriores se existirem
4. **Ativa Nova**: Cria a nova assinatura com o cupom aplicado

## ⚠️ Importante

- O usuário recebe um plano REAL no Stripe
- Após o período gratuito, seria cobrado (mas pode cancelar antes)
- O script requer acesso às credenciais do Stripe (STRIPE_SECRET_KEY)

## 📝 Logs

O script mostra:
- ID do Cliente Stripe
- ID da Assinatura
- Data de validade
- Status da operação

Guarde esses IDs caso precise gerenciar a assinatura depois no dashboard do Stripe.