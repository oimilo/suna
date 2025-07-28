-- Fix Basejump to create personal accounts with id = user_id
-- This ensures Suna works correctly without needing account_id lookups

-- First, let's drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS basejump.run_new_user_setup();

-- Recreate the function with the fix to use user_id as account_id
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    first_account_id    uuid;
    generated_user_name text;
BEGIN
    -- First we setup the user profile
    IF new.email IS NOT NULL THEN
        generated_user_name := split_part(new.email, '@', 1);
    END IF;
    
    -- Create the new user's personal account with id = user_id
    -- This is the key change - we explicitly set id = NEW.id
    INSERT INTO basejump.accounts (name, primary_owner_user_id, personal_account, id)
    VALUES (generated_user_name, NEW.id, true, NEW.id)
    RETURNING id INTO first_account_id;

    -- Add them to the account_user table so they can act on it
    INSERT INTO basejump.account_user (account_id, user_id, account_role)
    VALUES (first_account_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE PROCEDURE basejump.run_new_user_setup();

-- Now fix existing accounts where account_id != user_id
-- This will clean up the mess for existing users

-- First, let's see what we're dealing with
SELECT 
    u.id as user_id,
    u.email,
    au.account_id,
    a.personal_account,
    CASE WHEN u.id = au.account_id THEN 'OK' ELSE 'NEEDS FIX' END as status
FROM auth.users u
JOIN basejump.account_user au ON au.user_id = u.id
JOIN basejump.accounts a ON a.id = au.account_id
WHERE a.personal_account = true;

-- For admin@oimilo.com specifically, let's consolidate everything
-- under the account where account_id = user_id
DO $$
DECLARE
    correct_account_id UUID := '0fabc038-dab7-44d7-a3f3-fe0463180596';
    wrong_account_id UUID := 'bbf3822e-cf31-4bd7-afa2-e8b8c8ef2fd7';
BEGIN
    -- Update all data to use the correct account
    UPDATE projects SET account_id = correct_account_id WHERE account_id = wrong_account_id;
    UPDATE agents SET account_id = correct_account_id WHERE account_id = wrong_account_id;
    UPDATE threads SET account_id = correct_account_id WHERE account_id = wrong_account_id;
    UPDATE agent_runs SET account_id = correct_account_id WHERE account_id = wrong_account_id;
    
    -- Remove the user from the wrong account
    DELETE FROM basejump.account_user 
    WHERE user_id = correct_account_id AND account_id = wrong_account_id;
    
    -- Delete the wrong account if it has no other users
    DELETE FROM basejump.accounts 
    WHERE id = wrong_account_id 
    AND NOT EXISTS (
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = wrong_account_id
    );
    
    RAISE NOTICE 'Account consolidation completed for admin@oimilo.com';
END $$;

-- Create a function to ensure new users get proper setup
CREATE OR REPLACE FUNCTION ensure_user_has_correct_account()
RETURNS TRIGGER AS $$
BEGIN
    -- If a personal account doesn't exist with id = user_id, create it
    IF NOT EXISTS (
        SELECT 1 FROM basejump.accounts 
        WHERE id = NEW.id AND personal_account = true
    ) THEN
        -- Create account with id = user_id
        INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account)
        VALUES (
            NEW.id, 
            COALESCE(split_part(NEW.email, '@', 1), 'User'), 
            NEW.id, 
            true
        );
        
        -- Add user to account
        INSERT INTO basejump.account_user (account_id, user_id, account_role)
        VALUES (NEW.id, NEW.id, 'owner');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a safety trigger to ensure accounts are created correctly
DROP TRIGGER IF EXISTS ensure_user_account ON auth.users;
CREATE TRIGGER ensure_user_account
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_has_correct_account();