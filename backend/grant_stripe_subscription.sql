-- Grant Stripe subscription using the proper Suna billing system
-- This script helps create a manual subscription for admin users

-- 1. First, let's check the admin user exists
SELECT 
    u.id as user_id,
    u.email,
    u.created_at
FROM auth.users u
WHERE u.email = 'admin@oimilo.com';

-- 2. Check if there's already a billing customer
SELECT 
    bc.*
FROM basejump.billing_customers bc
JOIN auth.users u ON bc.account_id = u.id
WHERE u.email = 'admin@oimilo.com';

-- 3. If you need to create a billing customer manually (only if step 2 returns no results)
-- NOTE: You should create the customer through Stripe API/Dashboard first, then insert here
/*
INSERT INTO basejump.billing_customers (
    id,              -- This should be the Stripe customer ID (starts with cus_)
    account_id,      -- User ID from auth.users
    email,
    active,
    provider
)
SELECT 
    'cus_XXXXX',     -- Replace with actual Stripe customer ID
    u.id,
    u.email,
    true,
    'stripe'
FROM auth.users u
WHERE u.email = 'admin@oimilo.com'
ON CONFLICT (id) DO UPDATE 
SET active = true;
*/

-- 4. Check current subscription status through the API
-- The subscription should be created through Stripe, not manually in the database
-- Use the Stripe Dashboard or API to create a subscription with one of these price IDs:

/*
Available Stripe Price IDs (from config):
- STRIPE_FREE_TIER_ID: For free tier access
- STRIPE_TIER_2_20_ID: $20/month - 2 hours
- STRIPE_TIER_6_50_ID: $50/month - 6 hours
- STRIPE_TIER_12_100_ID: $100/month - 12 hours
- STRIPE_TIER_25_200_ID: $200/month - 25 hours
- STRIPE_TIER_50_400_ID: $400/month - 50 hours
- STRIPE_TIER_125_800_ID: $800/month - 125 hours
- STRIPE_TIER_200_1000_ID: $1000/month - 200 hours

For admin access, you probably want at least STRIPE_TIER_25_200_ID or higher.
*/

-- 5. After creating the subscription in Stripe, verify it's working by checking the billing API
-- You can test this by calling the /api/billing/subscription endpoint when logged in as admin@oimilo.com

-- 6. If you need to check what models are available for each tier:
-- Free tier: anthropic/claude-sonnet-4-20250514, openrouter/moonshotai/kimi-k2
-- Paid tiers: All models including GPT-4, Claude 3.5 Sonnet, Gemini 2.5 Pro, etc.