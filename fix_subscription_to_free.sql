-- Script para corrigir subscription manual e voltar ao plano free
-- Execute este script no Supabase SQL Editor

-- Primeiro, vamos verificar o que existe
SELECT 
    bc.id as customer_id,
    bc.account_id,
    bc.email,
    bs.id as subscription_id,
    bs.status,
    bs.price_id,
    bs.current_period_end
FROM basejump.billing_customers bc
LEFT JOIN basejump.billing_subscriptions bs ON bc.id = bs.customer_id
WHERE bc.email = 'marketing@oimilo.com'; -- Substitua pelo seu email

-- Remover subscriptions manuais (descomente para executar)
/*
DELETE FROM basejump.billing_subscriptions 
WHERE customer_id IN (
    SELECT id FROM basejump.billing_customers 
    WHERE email = 'marketing@oimilo.com' -- Substitua pelo seu email
)
AND (
    id LIKE 'sub_manual_%' 
    OR price_id LIKE 'price_manual_%'
    OR price_id NOT IN (
        -- Lista de price_ids oficiais do Stripe
        'price_1RqK0hFNfWjTbEjsaAFuY7Cb', -- Pro Monthly
        'price_1RqK0hFNfWjTbEjsN9XCGLA4', -- Pro Yearly
        'price_1RqK4xFNfWjTbEjsCrjfvJVL', -- Pro Max Monthly
        'price_1RqK6cFNfWjTbEjs75UPIgif'  -- Pro Max Yearly
    )
);
*/

-- Remover customer manual se não tiver mais subscriptions (descomente para executar)
/*
DELETE FROM basejump.billing_customers
WHERE email = 'marketing@oimilo.com' -- Substitua pelo seu email
AND id LIKE 'cus_manual_%'
AND NOT EXISTS (
    SELECT 1 FROM basejump.billing_subscriptions 
    WHERE customer_id = basejump.billing_customers.id
);
*/

-- Verificar o resultado final
SELECT 
    bc.id as customer_id,
    bc.account_id,
    bc.email,
    bs.id as subscription_id,
    bs.status,
    bs.price_id,
    bs.current_period_end
FROM basejump.billing_customers bc
LEFT JOIN basejump.billing_subscriptions bs ON bc.id = bs.customer_id
WHERE bc.email = 'marketing@oimilo.com'; -- Substitua pelo seu email