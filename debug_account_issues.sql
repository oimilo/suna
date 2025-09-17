-- Debug account issues for admin@oimilo.com

-- 1. Check user accounts
SELECT 
    u.id as user_id,
    u.email,
    au.account_id,
    a.name as account_name,
    a.personal_account
FROM auth.users u
LEFT JOIN basejump.account_user au ON au.user_id = u.id
LEFT JOIN basejump.accounts a ON a.id = au.account_id
WHERE u.email = 'admin@oimilo.com';

-- 2. Check projects by different account_ids
SELECT 
    project_id,
    name,
    account_id,
    created_at,
    sandbox->>'id' as sandbox_id
FROM projects
WHERE account_id IN (
    '0fabc038-dab7-44d7-a3f3-fe0463180596',
    'bbf3822e-cf31-4bd7-afa2-e8b8c8ef2fd7'
)
ORDER BY created_at DESC;

-- 3. Check agents by account_id
SELECT 
    agent_id,
    name,
    account_id,
    created_at
FROM agents
WHERE account_id IN (
    '0fabc038-dab7-44d7-a3f3-fe0463180596',
    'bbf3822e-cf31-4bd7-afa2-e8b8c8ef2fd7'
);

-- 4. Check recent threads
SELECT 
    thread_id,
    project_id,
    account_id,
    created_at
FROM threads
WHERE account_id IN (
    '0fabc038-dab7-44d7-a3f3-fe0463180596',
    'bbf3822e-cf31-4bd7-afa2-e8b8c8ef2fd7'
)
ORDER BY created_at DESC
LIMIT 10;