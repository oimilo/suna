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
SELECT a.*, av.version_number
FROM public.agents a
LEFT JOIN public.agent_versions av ON av.agent_id = a.id AND av.is_current = true
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
    instructions,
    account_id,
    is_public,
    is_template,
    avatar_url
) VALUES (
    'Assistant',
    'A helpful AI assistant',
    'You are a helpful AI assistant. Be concise and clear in your responses.',
    'YOUR_ACCOUNT_ID', -- Replace this!
    false,
    false,
    null
) RETURNING id;
*/