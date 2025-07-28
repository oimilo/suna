-- SAFE RESET ALL ACCOUNTS
-- This script will safely delete all data and recreate accounts properly
-- It checks if tables exist before trying to delete from them

BEGIN;

-- 1. Delete all application data (only if tables exist)
DO $$
BEGIN
    -- Delete agent_runs if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_runs') THEN
        DELETE FROM agent_runs;
        RAISE NOTICE 'Deleted all agent_runs';
    END IF;
    
    -- Delete threads if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'threads') THEN
        DELETE FROM threads;
        RAISE NOTICE 'Deleted all threads';
    END IF;
    
    -- Delete agents if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
        DELETE FROM agents;
        RAISE NOTICE 'Deleted all agents';
    END IF;
    
    -- Delete projects if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        DELETE FROM projects;
        RAISE NOTICE 'Deleted all projects';
    END IF;
    
    -- Delete devices if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'devices') THEN
        DELETE FROM devices;
        RAISE NOTICE 'Deleted all devices';
    END IF;
    
    -- Delete recordings if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recordings') THEN
        DELETE FROM recordings;
        RAISE NOTICE 'Deleted all recordings';
    END IF;
END $$;

-- 2. Delete all account relationships
DELETE FROM basejump.account_user;
RAISE NOTICE 'Deleted all account_user relationships';

-- 3. Delete all accounts
DELETE FROM basejump.accounts;
RAISE NOTICE 'Deleted all accounts';

-- 4. Drop and recreate the trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS basejump.run_new_user_setup();

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

    RAISE NOTICE 'Created account for user % with id %', NEW.email, NEW.id;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE PROCEDURE basejump.run_new_user_setup();

RAISE NOTICE 'Recreated trigger function with correct behavior';

-- 5. Recreate accounts for ALL existing users
DO $$
DECLARE
    user_record RECORD;
    account_count INTEGER := 0;
BEGIN
    FOR user_record IN SELECT id, email, created_at FROM auth.users ORDER BY created_at
    LOOP
        -- Create account with id = user_id
        INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account, created_at)
        VALUES (
            user_record.id, 
            COALESCE(split_part(user_record.email, '@', 1), 'User'), 
            user_record.id, 
            true,
            user_record.created_at
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Add user as owner
        INSERT INTO basejump.account_user (account_id, user_id, account_role)
        VALUES (user_record.id, user_record.id, 'owner')
        ON CONFLICT DO NOTHING;
        
        account_count := account_count + 1;
        RAISE NOTICE 'Created account for user % (user_id = account_id = %)', user_record.email, user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Created % accounts total', account_count;
END $$;

-- 6. Create default agent for each user (only if agents table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') THEN
        INSERT INTO agents (agent_id, account_id, name, description, capabilities, is_public, created_at)
        SELECT 
            gen_random_uuid(),
            u.id,
            'Default Agent',
            'A helpful AI assistant ready to help you with various tasks',
            ARRAY['general', 'coding', 'research']::text[],
            false,
            NOW()
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM agents a WHERE a.account_id = u.id
        );
        
        RAISE NOTICE 'Created default agents for users without agents';
    END IF;
END $$;

-- 7. Verify the fix
RAISE NOTICE '';
RAISE NOTICE '=== VERIFICATION RESULTS ===';
RAISE NOTICE '';

-- Show all users and their account status
DO $$
DECLARE
    verification_record RECORD;
    all_correct BOOLEAN := true;
BEGIN
    RAISE NOTICE 'User Account Verification:';
    RAISE NOTICE '----------------------------------------';
    
    FOR verification_record IN 
        SELECT 
            u.email,
            u.id as user_id,
            a.id as account_id,
            au.account_role,
            CASE WHEN u.id = a.id THEN true ELSE false END as is_correct
        FROM auth.users u
        LEFT JOIN basejump.account_user au ON au.user_id = u.id
        LEFT JOIN basejump.accounts a ON a.id = au.account_id
        WHERE a.personal_account = true OR a.personal_account IS NULL
        ORDER BY u.created_at
    LOOP
        IF verification_record.is_correct THEN
            RAISE NOTICE '✓ % - user_id and account_id match (%)', 
                verification_record.email, verification_record.user_id;
        ELSE
            RAISE NOTICE '✗ % - MISMATCH! user_id=% account_id=%', 
                verification_record.email, verification_record.user_id, verification_record.account_id;
            all_correct := false;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    IF all_correct THEN
        RAISE NOTICE 'SUCCESS: All accounts are correctly configured!';
    ELSE
        RAISE NOTICE 'ERROR: Some accounts have mismatched IDs!';
    END IF;
END $$;

COMMIT;

-- Final summary
RAISE NOTICE '';
RAISE NOTICE '=== RESET COMPLETE ===';
RAISE NOTICE 'All users now have account_id = user_id';
RAISE NOTICE 'Future users will automatically get correct accounts';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Test login with your user';
RAISE NOTICE '2. Verify you can create agents and projects';
RAISE NOTICE '3. Deploy the updated code to production';