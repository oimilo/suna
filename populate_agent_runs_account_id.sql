-- Populate account_id in agent_runs table
UPDATE agent_runs ar
SET account_id = t.account_id
FROM threads t
WHERE ar.thread_id = t.thread_id
AND ar.account_id IS NULL;

-- Verify the update
SELECT COUNT(*) as total_runs,
       COUNT(account_id) as runs_with_account,
       COUNT(*) - COUNT(account_id) as runs_without_account
FROM agent_runs;

-- Check recent runs
SELECT 
    agent_run_id,
    agent_id,
    thread_id,
    account_id,
    status,
    error,
    created_at
FROM agent_runs
WHERE account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY created_at DESC
LIMIT 5;