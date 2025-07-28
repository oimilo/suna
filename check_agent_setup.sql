-- Check agent setup for user admin@oimilo.com

-- First, find the user
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@oimilo.com';

-- Find the account for this user
SELECT au.*, a.name as account_name, a.slug 
FROM basejump.account_user au
JOIN basejump.accounts a ON a.id = au.account_id
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'admin@oimilo.com';

-- Check if there are any agents for this account
SELECT a.*
FROM public.agents a
WHERE a.account_id IN (
    SELECT account_id 
    FROM basejump.account_user au
    JOIN auth.users u ON u.id = au.user_id
    WHERE u.email = 'admin@oimilo.com'
);

-- If no agents exist, this will create a default agent
-- IMPORTANT: Replace YOUR_ACCOUNT_ID with the actual account_id from the second query above
/*
INSERT INTO public.agents (
    name,
    description,
    system_prompt,
    account_id,
    is_default,
    avatar,
    avatar_color
) VALUES (
    'Assistant',
    'A helpful AI assistant',
    'You are a helpful AI assistant. Be concise and clear in your responses.',
    'YOUR_ACCOUNT_ID', -- Replace this!
    true,
    '🤖',
    '#6366f1'
) RETURNING agent_id;
*/