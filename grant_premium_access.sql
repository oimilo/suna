-- Grant premium access to admin@oimilo.com

-- 1. First check if subscriptions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions'
);

-- 2. Check current subscription status
SELECT 
    s.*,
    u.email
FROM subscriptions s
JOIN auth.users u ON s.account_id = u.id
WHERE u.email = 'admin@oimilo.com';

-- 3. Create or update subscription for admin user
-- First get the user/account ID
DO $$
DECLARE
    user_account_id UUID;
BEGIN
    SELECT id INTO user_account_id 
    FROM auth.users 
    WHERE email = 'admin@oimilo.com';
    
    -- Insert or update subscription
    INSERT INTO subscriptions (
        id,
        account_id,
        status,
        plan_name,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        user_account_id,
        'active',
        'premium', -- or 'pro', 'enterprise' depending on what's available
        NOW(),
        NOW()
    )
    ON CONFLICT (account_id) 
    DO UPDATE SET
        status = 'active',
        plan_name = 'premium',
        updated_at = NOW();
        
    RAISE NOTICE 'Premium access granted to admin@oimilo.com';
END $$;

-- 4. Verify the subscription was created
SELECT 
    s.*,
    u.email
FROM subscriptions s
JOIN auth.users u ON s.account_id = u.id
WHERE u.email = 'admin@oimilo.com';