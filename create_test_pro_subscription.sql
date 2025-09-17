-- Script para criar uma subscription Pro de teste corretamente
-- Execute este script no Supabase SQL Editor

-- Opção 1: Criar subscription Pro de teste com price_id oficial
-- Isso fará o sistema reconhecer você como Pro sem conflitos

-- Primeiro, obtenha seu account_id
SELECT id, email FROM auth.users WHERE email = 'marketing@oimilo.com'; -- Substitua pelo seu email

-- Criar customer se não existir
INSERT INTO basejump.billing_customers (id, account_id, email, provider, active)
SELECT 
    'cus_test_' || substr(md5(random()::text), 1, 14) as id,
    id as account_id,
    email,
    'stripe' as provider,
    true as active
FROM auth.users 
WHERE email = 'marketing@oimilo.com' -- Substitua pelo seu email
AND NOT EXISTS (
    SELECT 1 FROM basejump.billing_customers bc 
    WHERE bc.account_id = auth.users.id
);

-- Criar subscription Pro de teste (usando price_id oficial do Pro Monthly)
INSERT INTO basejump.billing_subscriptions (
    id,
    customer_id,
    status,
    price_id,
    quantity,
    current_period_start,
    current_period_end,
    cancel_at_period_end
)
SELECT 
    'sub_test_' || substr(md5(random()::text), 1, 20) as id,
    bc.id as customer_id,
    'active' as status,
    'price_1RqK0hFNfWjTbEjsaAFuY7Cb' as price_id, -- Pro Monthly oficial
    1 as quantity,
    NOW() as current_period_start,
    NOW() + INTERVAL '30 days' as current_period_end,
    false as cancel_at_period_end
FROM basejump.billing_customers bc
JOIN auth.users u ON bc.account_id = u.id
WHERE u.email = 'marketing@oimilo.com' -- Substitua pelo seu email
AND NOT EXISTS (
    SELECT 1 FROM basejump.billing_subscriptions bs 
    WHERE bs.customer_id = bc.id
    AND bs.status = 'active'
);

-- Verificar o resultado
SELECT 
    u.email,
    bc.id as customer_id,
    bs.id as subscription_id,
    bs.status,
    bs.price_id,
    bs.current_period_end,
    CASE 
        WHEN bs.price_id = 'price_1RqK0hFNfWjTbEjsaAFuY7Cb' THEN 'Pro Monthly'
        WHEN bs.price_id = 'price_1RqK0hFNfWjTbEjsN9XCGLA4' THEN 'Pro Yearly'
        WHEN bs.price_id = 'price_1RqK4xFNfWjTbEjsCrjfvJVL' THEN 'Pro Max Monthly'
        WHEN bs.price_id = 'price_1RqK6cFNfWjTbEjs75UPIgif' THEN 'Pro Max Yearly'
        ELSE 'Unknown'
    END as plan_name
FROM auth.users u
JOIN basejump.billing_customers bc ON u.id = bc.account_id
LEFT JOIN basejump.billing_subscriptions bs ON bc.id = bs.customer_id
WHERE u.email = 'marketing@oimilo.com'; -- Substitua pelo seu email

-- Para remover a subscription de teste depois:
/*
DELETE FROM basejump.billing_subscriptions 
WHERE id LIKE 'sub_test_%'
AND customer_id IN (
    SELECT bc.id FROM basejump.billing_customers bc
    JOIN auth.users u ON bc.account_id = u.id
    WHERE u.email = 'marketing@oimilo.com' -- Substitua pelo seu email
);
*/