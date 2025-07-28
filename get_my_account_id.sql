-- Get the account_id for admin@oimilo.com
-- Run this first to get your actual account_id

SELECT 
    u.id as user_id,
    u.email,
    au.account_id,
    a.name as account_name,
    a.personal_account,
    a.slug
FROM auth.users u
LEFT JOIN basejump.account_user au ON au.user_id = u.id
LEFT JOIN basejump.accounts a ON a.id = au.account_id
WHERE u.email = 'admin@oimilo.com';

-- Once you have the account_id, you can check which agents belong to you:
-- SELECT * FROM agents WHERE account_id = 'YOUR_ACCOUNT_ID_HERE';