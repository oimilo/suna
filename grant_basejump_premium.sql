-- Grant premium access using Basejump billing system

-- 1. Check if billing tables exist
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'basejump' 
AND table_name IN ('billing_customers', 'billing_subscriptions');

-- 2. Get user account info
SELECT 
    u.id as user_id,
    u.email,
    a.id as account_id
FROM auth.users u
JOIN basejump.accounts a ON a.id = u.id
WHERE u.email = 'admin@oimilo.com';

-- 3. Create billing customer if not exists
INSERT INTO basejump.billing_customers (
    id,
    account_id,
    email,
    active,
    provider
)
SELECT 
    'cus_admin_' || u.id,
    a.id,
    u.email,
    true,
    'manual'
FROM auth.users u
JOIN basejump.accounts a ON a.id = u.id
WHERE u.email = 'admin@oimilo.com'
ON CONFLICT (id) DO UPDATE 
SET active = true;

-- 4. Create active subscription
INSERT INTO basejump.billing_subscriptions (
    id,
    account_id,
    billing_customer_id,
    status,
    plan_name,
    price_id,
    quantity,
    cancel_at_period_end,
    created,
    current_period_start,
    current_period_end
)
SELECT 
    'sub_admin_' || u.id,
    a.id,
    'cus_admin_' || u.id,
    'active',
    'premium', -- or 'pro', 'enterprise'
    'price_premium',
    1,
    false,
    NOW(),
    NOW(),
    NOW() + INTERVAL '1 year'
FROM auth.users u
JOIN basejump.accounts a ON a.id = u.id
WHERE u.email = 'admin@oimilo.com'
ON CONFLICT (id) DO UPDATE 
SET 
    status = 'active',
    plan_name = 'premium',
    current_period_end = NOW() + INTERVAL '1 year',
    cancel_at_period_end = false;

-- 5. Verify the subscription
SELECT 
    bs.*,
    bc.email,
    a.name as account_name
FROM basejump.billing_subscriptions bs
JOIN basejump.billing_customers bc ON bs.billing_customer_id = bc.id
JOIN basejump.accounts a ON bs.account_id = a.id
WHERE bc.email = 'admin@oimilo.com';