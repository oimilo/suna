-- Fix agent_runs table structure
BEGIN;

-- Add missing columns if they don't exist
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS agent_run_id UUID DEFAULT gen_random_uuid();
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS account_id UUID;

-- If agent_run_id was just added, copy id values to it
UPDATE agent_runs SET agent_run_id = id WHERE agent_run_id IS NULL;

-- Add NOT NULL constraint after populating
ALTER TABLE agent_runs ALTER COLUMN agent_run_id SET NOT NULL;

-- Create unique constraint on agent_run_id
ALTER TABLE agent_runs ADD CONSTRAINT agent_runs_agent_run_id_key UNIQUE (agent_run_id);

-- Add foreign key for account_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'agent_runs_account_id_fkey'
    ) THEN
        ALTER TABLE agent_runs 
        ADD CONSTRAINT agent_runs_account_id_fkey 
        FOREIGN KEY (account_id) 
        REFERENCES basejump.accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update account_id from threads table
UPDATE agent_runs ar
SET account_id = t.account_id
FROM threads t
WHERE ar.thread_id = t.thread_id
AND ar.account_id IS NULL;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_runs'
ORDER BY ordinal_position;

COMMIT;