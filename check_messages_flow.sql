-- Check messages in the thread
SELECT 
    m.message_id,
    m.thread_id,
    m.role,
    LEFT(m.content, 100) as content_preview,
    m.created_at,
    m.updated_at
FROM messages m
JOIN threads t ON m.thread_id = t.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY m.created_at DESC
LIMIT 20;

-- Check if agent is creating responses
SELECT 
    ar.agent_run_id,
    ar.thread_id,
    ar.status,
    ar.error,
    ar.started_at,
    ar.completed_at,
    ar.metadata
FROM agent_runs ar
WHERE ar.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
  AND ar.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY ar.created_at DESC;

-- Check for assistant messages
SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
    SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_messages
FROM messages m
JOIN threads t ON m.thread_id = t.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
  AND m.created_at > NOW() - INTERVAL '1 hour';