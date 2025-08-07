-- Script para gerenciar subscriptions de teste no Prophet
-- IMPORTANTE: Essas subscriptions são apenas para teste local
-- Elas NÃO aparecerão no Stripe!

-- =============================================================================
-- CONFIGURAÇÃO: Altere estas variáveis conforme necessário
-- =============================================================================
DO $$
DECLARE
    target_email TEXT := 'marketing@oimilo.com'; -- ALTERE PARA O EMAIL DESEJADO
    target_plan TEXT := 'pro'; -- Opções: 'free', 'pro', 'pro_max'
    plan_duration_months INT := 1; -- Duração em meses
    
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
    
    -- Para plano FREE, apenas remover subscription e sair
    IF target_plan = 'free' THEN
        RAISE NOTICE '✅ Usuário % configurado para plano FREE', target_email;
        RETURN;
    END IF;
    
    -- Definir price_id baseado no plano
    CASE target_plan
        WHEN 'pro' THEN
            price_id := 'price_1RqK0hFNfWjTbEjsaAFuY7Cb';
            plan_name := 'Pro Monthly';
        WHEN 'pro_max' THEN
            price_id := 'price_1RqK4xFNfWjTbEjsCrjfvJVL';
            plan_name := 'Pro Max Monthly';
        ELSE
            RAISE EXCEPTION 'Plano inválido: %. Use: free, pro, pro_max', target_plan;
    END CASE;
    
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
            'created_at', NOW()::TEXT
        )
    );
    
    RAISE NOTICE '✅ Usuário % configurado para plano %', target_email, plan_name;
    RAISE NOTICE '   Válido por % mês(es)', plan_duration_months;
    
END $$;

-- =============================================================================
-- VERIFICAR RESULTADO
-- =============================================================================
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
WHERE u.email = 'marketing@oimilo.com' -- ALTERE PARA O EMAIL DESEJADO
ORDER BY u.email;

-- =============================================================================
-- QUERIES ÚTEIS
-- =============================================================================

-- Listar todas as subscriptions de teste
/*
SELECT 
    bc.email,
    bs.id as subscription_id,
    bs.price_id,
    bs.status,
    bs.current_period_end::date as valid_until,
    bs.metadata
FROM basejump.billing_subscriptions bs
JOIN basejump.billing_customers bc ON bs.customer_id = bc.id
WHERE bs.id LIKE 'sub_test_%'
ORDER BY bs.created DESC;
*/

-- Remover TODAS as subscriptions de teste
/*
DELETE FROM basejump.billing_subscriptions 
WHERE id LIKE 'sub_test_%';

DELETE FROM basejump.billing_customers 
WHERE id LIKE 'cus_test_%'
AND id NOT IN (
    SELECT DISTINCT customer_id 
    FROM basejump.billing_subscriptions
);
*/

-- Ver estatísticas de subscriptions
/*
SELECT 
    CASE 
        WHEN id LIKE 'sub_test_%' THEN 'Test Subscription'
        WHEN id LIKE 'sub_manual_%' THEN 'Manual Assignment'
        ELSE 'Stripe Subscription'
    END as subscription_type,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM basejump.billing_subscriptions
GROUP BY subscription_type;
*/