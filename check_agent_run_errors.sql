-- Check recent agent runs and their status
SELECT 
    agent_run_id,
    agent_id,
    thread_id,
    status,
    error,
    created_at,
    updated_at
FROM agent_runs
WHERE account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any messages in threads
SELECT 
    m.message_id,
    m.thread_id,
    m.role,
    m.content,
    m.created_at,
    t.project_id
FROM messages m
JOIN threads t ON m.thread_id = t.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY m.created_at DESC
LIMIT 10;