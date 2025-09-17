-- RESET ALL ACCOUNTS - USE WITH CAUTION
-- This script will delete all data and recreate accounts properly

BEGIN;

-- 1. Delete all application data
DELETE FROM agent_runs WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_runs');
DELETE FROM threads WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'threads');
DELETE FROM agents WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents');
DELETE FROM projects WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects');
-- Skip devices and recordings if they don't exist
DELETE FROM devices WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'devices');
DELETE FROM recordings WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recordings');

-- 2. Delete all account relationships
DELETE FROM basejump.account_user;

-- 3. Delete all accounts
DELETE FROM basejump.accounts;

-- 4. Fix the trigger to create accounts with id = user_id
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    generated_user_name text;
BEGIN
    -- Get username from email
    IF new.email IS NOT NULL THEN
        generated_user_name := split_part(new.email, '@', 1);
    END IF;
    
    -- Create account with id = user_id (this is the key!)
    INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account)
    VALUES (NEW.id, COALESCE(generated_user_name, 'User'), NEW.id, true);

    -- Add user as owner of their account
    INSERT INTO basejump.account_user (account_id, user_id, account_role)
    VALUES (NEW.id, NEW.id, 'owner');

    RETURN NEW;
END;
$$;

-- 5. Recreate accounts for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users
    LOOP
        -- Create account with id = user_id
        INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account)
        VALUES (
            user_record.id, 
            COALESCE(split_part(user_record.email, '@', 1), 'User'), 
            user_record.id, 
            true
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Add user as owner
        INSERT INTO basejump.account_user (account_id, user_id, account_role)
        VALUES (user_record.id, user_record.id, 'owner')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created account for user %', user_record.email;
    END LOOP;
END $$;

-- 6. Create default agent for each user
INSERT INTO agents (agent_id, account_id, name, description, capabilities, is_public)
SELECT 
    gen_random_uuid(),
    u.id,
    'Default Agent',
    'A helpful AI assistant',
    ARRAY['general', 'coding', 'research'],
    false
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM agents a WHERE a.account_id = u.id
);

-- 7. Verify the fix
SELECT 
    u.email,
    u.id as user_id,
    a.id as account_id,
    CASE WHEN u.id = a.id THEN '✓ CORRECT' ELSE '✗ WRONG' END as status
FROM auth.users u
LEFT JOIN basejump.account_user au ON au.user_id = u.id
LEFT JOIN basejump.accounts a ON a.id = au.account_id
WHERE a.personal_account = true
ORDER BY u.created_at;

COMMIT;

-- Instructions:
-- 1. Run this script in Supabase SQL Editor
-- 2. All users will have their data reset
-- 3. New accounts will be created with account_id = user_id
-- 4. Each user will get a default agent
-- 5. Future users will automatically get accounts with correct IDs