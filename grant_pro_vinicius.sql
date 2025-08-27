-- Script para dar plano PRO de 1 mês para vinicius@agenciadebolso.com
-- Usando o sistema Basejump com subscription "fake" do Stripe

DO $$
DECLARE
    target_email TEXT := 'vinicius@agenciadebolso.com';
    target_plan TEXT := 'pro';
    plan_duration_months INT := 1;
    
    -- Variáveis internas
    user_id UUID;
    customer_id TEXT;
    price_id TEXT;
    plan_name TEXT;
BEGIN
    -- Obter user_id do auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', target_email;
    END IF;
    
    -- Limpar subscriptions existentes
    DELETE FROM basejump.billing_subscriptions 
    WHERE customer_id IN (
        SELECT id FROM basejump.billing_customers 
        WHERE account_id = user_id
    );
    
    -- Definir price_id para plano PRO
    price_id := 'price_1RqK0hFNfWjTbEjsaAFuY7Cb';
    plan_name := 'Pro Monthly';
    
    -- Verificar se customer existe
    SELECT id INTO customer_id 
    FROM basejump.billing_customers 
    WHERE account_id = user_id;
    
    -- Criar customer se não existir
    IF customer_id IS NULL THEN
        customer_id := 'cus_test_' || substr(md5(random()::text), 1, 14);
        
        INSERT INTO basejump.billing_customers (
            id, 
            account_id, 
            email, 
            provider, 
            active
        ) VALUES (
            customer_id, 
            user_id, 
            target_email, 
            'stripe', 
            true
        );
        
        RAISE NOTICE '📝 Criado customer de teste: %', customer_id;
    END IF;
    
    -- Criar nova subscription
    INSERT INTO basejump.billing_subscriptions (
        id,
        customer_id,
        status,
        price_id,
        quantity,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created,
        metadata
    ) VALUES (
        'sub_test_' || substr(md5(random()::text), 1, 20),
        customer_id,
        'active',
        price_id,
        1,
        NOW(),
        NOW() + (plan_duration_months || ' months')::INTERVAL,
        false,
        NOW(),
        jsonb_build_object(
            'test_subscription', true,
            'created_by_sql', true,
            'created_at', NOW()::TEXT,
            'created_for', 'Vinicius - Agência de Bolso',
            'reason', 'Plano PRO de 1 mês conforme solicitado'
        )
    );
    
    RAISE NOTICE '✅ Usuário % configurado para plano %', target_email, plan_name;
    RAISE NOTICE '   Válido por % mês(es)', plan_duration_months;
    
END $$;

-- Verificar o resultado
SELECT 
    u.email,
    bc.id as customer_id,
    bs.id as subscription_id,
    bs.status,
    bs.price_id,
    bs.current_period_end::date as valid_until,
    CASE 
        WHEN bs.price_id = 'price_1RqK0hFNfWjTbEjsaAFuY7Cb' THEN 'Pro Monthly'
        WHEN bs.price_id = 'price_1RqK0hFNfWjTbEjsN9XCGLA4' THEN 'Pro Yearly'
        WHEN bs.price_id = 'price_1RqK4xFNfWjTbEjsCrjfvJVL' THEN 'Pro Max Monthly'
        WHEN bs.price_id = 'price_1RqK6cFNfWjTbEjs75UPIgif' THEN 'Pro Max Yearly'
        WHEN bs.price_id IS NULL THEN 'FREE (No subscription)'
        ELSE 'Unknown'
    END as plan_name,
    bs.metadata
FROM auth.users u
LEFT JOIN basejump.billing_customers bc ON u.id = bc.account_id
LEFT JOIN basejump.billing_subscriptions bs ON bc.id = bs.customer_id AND bs.status = 'active'
WHERE u.email = 'vinicius@agenciadebolso.com'
ORDER BY u.email;