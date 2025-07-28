-- This script applies all necessary migrations for Suna
-- Run this in your Supabase SQL editor

-- First, check if basejump is properly installed
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'basejump'
) as basejump_exists;

-- Check if the account_user table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'basejump' 
    AND table_name = 'account_user'
) as account_user_exists;

-- If you see FALSE for either query above, you need to run the basejump migrations first
-- The migrations are in the supabase/migrations folder in order

-- Key tables to check:
SELECT 
    'agents' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agents') as exists
UNION ALL
SELECT 
    'agent_runs' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_runs') as exists
UNION ALL
SELECT 
    'threads' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'threads') as exists
UNION ALL
SELECT 
    'messages' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') as exists
UNION ALL
SELECT 
    'projects' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') as exists;

-- If any of the above tables don't exist, you need to run the migrations