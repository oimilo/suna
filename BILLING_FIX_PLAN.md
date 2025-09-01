# 🔧 Plano de Correção do Sistema de Billing

## 📋 Resumo do Problema

### Situação Atual
- **Webhook do Stripe** (`/backend/services/billing.py` linha ~1164-1243): Apenas atualiza campo `active` do customer, NÃO sincroniza subscriptions
- **Acesso PRO funciona**: Sistema consulta Stripe API em tempo real via `get_user_subscription()`
- **Admin panel quebrado**: Lê de `billing_subscriptions` local (vazia)
- **3 usuários afetados**: start@prophet.build, cavallari@neurociente.com.br, vinicius@agenciadebolso.com

### Estrutura do Banco
```
billing_subscriptions (public schema)
├── account_id → accounts.id (FK)
├── customer_id → billing_customers.id (FK)
└── price_id, status, metadata, etc.

billing_customers (basejump schema)
├── id (Stripe customer ID)
├── account_id → accounts.id
└── email, provider, active

accounts (public schema + basejump schema)
├── id (= user_id para contas pessoais)
├── name, personal_account
└── primary_owner_user_id (basejump only)
```

## 🛠️ Implementação do Fix

### Fase 1: Script de Sincronização Inicial
**Arquivo**: `/frontend/src/app/(admin)/admin/sync-stripe-full/route.ts`

```typescript
// Pseudocódigo da implementação
1. Buscar todas subscriptions ativas do Stripe
2. Para cada subscription:
   a. Extrair customer_id e buscar customer no Stripe
   b. Encontrar user_id pelo email do customer
   c. Garantir que existe registro em 'accounts' (schema público)
   d. Garantir que existe registro em 'billing_customers' (basejump)
   e. Criar/atualizar 'billing_subscription' com dados completos
   f. Criar 'billing_price' se não existir
```

### Fase 2: Modificar Webhook
**Arquivo**: `/backend/services/billing.py`
**Localização**: Linha ~1186-1240 (dentro da função `stripe_webhook`)

#### Código Atual (PROBLEMA)
```python
if event.type in ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']:
    subscription = event.data.object
    customer_id = subscription.get('customer')
    
    # APENAS atualiza active status
    await client.schema('basejump').from_('billing_customers').update(
        {'active': True}
    ).eq('id', customer_id).execute()
```

#### Código Novo (SOLUÇÃO)
```python
if event.type in ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']:
    subscription = event.data.object
    customer_id = subscription.get('customer')
    
    # 1. Buscar user_id através do customer
    customer_result = await client.schema('basejump').from_('billing_customers')\
        .select('account_id').eq('id', customer_id).execute()
    
    if not customer_result.data:
        # Buscar customer no Stripe para pegar email
        stripe_customer = stripe.Customer.retrieve(customer_id)
        # Buscar user por email
        # Criar billing_customer se necessário
    
    user_id = customer_result.data[0]['account_id']
    
    # 2. Garantir que account existe
    account_exists = await client.from_('accounts')\
        .select('id').eq('id', user_id).execute()
    
    if not account_exists.data:
        # Criar account pessoal
        await client.from_('accounts').insert({
            'id': user_id,
            'name': email.split('@')[0],
            'personal_account': True
        }).execute()
    
    # 3. Sincronizar subscription
    if event.type == 'customer.subscription.deleted':
        # Marcar como canceled
        await client.from_('billing_subscriptions')\
            .update({'status': 'canceled'})\
            .eq('id', subscription['id']).execute()
    else:
        # Criar/atualizar subscription
        subscription_data = {
            'id': subscription['id'],
            'account_id': user_id,
            'customer_id': customer_id,
            'status': subscription['status'],
            'price_id': subscription['items']['data'][0]['price']['id'],
            'quantity': subscription['items']['data'][0]['quantity'],
            'current_period_start': datetime.fromtimestamp(subscription['current_period_start']).isoformat(),
            'current_period_end': datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
            'cancel_at_period_end': subscription['cancel_at_period_end'],
            'metadata': {'synced_from_webhook': True}
        }
        
        await client.from_('billing_subscriptions')\
            .upsert(subscription_data, on_conflict='id')\
            .execute()
```

## 📊 Dados dos Usuários Afetados

### Subscriptions no Stripe (já identificadas)
```json
{
  "start@prophet.build": {
    "subscription_id": "sub_1RwuAjFNfWjTbEjsF6E2QewK",
    "customer_id": "cus_SsfVoAZWvFkukD",
    "user_id": "29e38efa-512a-47c0-9130-0ca0cedeb533"
  },
  "cavallari@neurociente.com.br": {
    "subscription_id": "sub_1RwM1oFNfWjTbEjsWvlLqvBV",
    "customer_id": "cus_Ss6AWUuoQpkCWA",
    "user_id": "d63efb0e-a5f9-40d4-b07f-2fce1322b86e"
  },
  "vinicius@agenciadebolso.com": {
    "subscription_id": "sub_1S06UGFNfWjTbEjsGHAr8Q8Q",
    "customer_id": "cus_SvyRn9X5JAgtLS",
    "user_id": "f581c772-e0ef-4ed9-890a-ecebef03cc93"
  }
}
```

## ✅ Checklist de Implementação

- [x] 1. Criar script de sincronização inicial em `/frontend/src/app/(admin)/admin/sync-stripe-full/route.ts`
- [x] 2. Testar script com dry-run primeiro
- [x] 3. Executar sincronização dos 3 usuários (via fix manual em `/admin/fix-billing`)
- [x] 4. Verificar se aparecem em `/admin/billing` (confirmado via banco de dados)
- [x] 5. Modificar webhook em `/backend/services/billing.py` 
- [ ] 6. Testar webhook com Stripe CLI: `stripe listen --forward-to localhost:8000/api/billing/webhook`
- [ ] 7. Criar subscription de teste para validar
- [x] 8. Documentar mudanças

## 🎯 Resultado Esperado

Após implementação:
1. **Admin panel**: Mostrará todos os usuários com assinaturas ativas
2. **Novos usuários**: Serão sincronizados automaticamente via webhook
3. **Performance**: Sistema poderá usar dados locais quando apropriado
4. **Compatibilidade**: Sistema atual continua funcionando sem quebrar

## ⚠️ Notas Importantes

- O sistema continuará consultando Stripe em tempo real (fallback)
- Webhook agora criará registros locais para admin/relatórios
- Foreign keys exigem ordem: accounts → billing_customers → billing_subscriptions
- Usar `upsert` com `on_conflict` para evitar duplicatas

## 📝 Status da Implementação (Atualizado)

### ✅ Concluído

1. **Fix Manual Aplicado**: Os 3 usuários PRO agora têm registros em `billing_subscriptions`:
   - start@prophet.build ✅
   - cavallari@neurociente.com.br ✅
   - vinicius@agenciadebolso.com ✅

2. **Webhook Modificado**: O webhook em `/backend/services/billing.py` foi atualizado para:
   - Continuar atualizando status `active` no customer (comportamento original)
   - **NOVO**: Sincronizar subscriptions completas para `billing_subscriptions`
   - **NOVO**: Criar accounts e customers automaticamente se não existirem
   - **NOVO**: Marcar subscriptions como `canceled` quando deletadas

3. **Estrutura do Banco Descoberta**:
   - `basejump.billing_customers`: id, account_id, email, active, provider
   - `public.billing_customers`: id, account_id, customer_id, email, created_at, updated_at, created_by, updated_by
   - As tabelas têm estruturas diferentes! O campo `customer_id` no público corresponde ao `id` no basejump

### ⚠️ Pendente

- Testar webhook com Stripe CLI para validar que novas subscriptions serão sincronizadas
- Considerar migração futura para unificar estrutura das tabelas billing_customers

### 🔧 Arquivos Modificados

1. `/backend/services/billing.py` - Webhook atualizado (linhas ~1199-1300)
2. `/frontend/src/app/(admin)/admin/fix-billing/route.ts` - Script de fix manual criado
3. `/frontend/src/app/(admin)/admin/sync-stripe-full/route.ts` - Script de sincronização completa
4. `/frontend/src/app/(admin)/admin/check-customers/route.ts` - Utilitário de debug
5. `/frontend/src/lib/supabase/admin.ts` - Cliente admin para bypass de RLS