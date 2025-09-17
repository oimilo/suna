-- Check messages with correct structure
SELECT 
    m.message_id,
    m.thread_id,
    m.type,
    m.is_llm_message,
    LEFT(m.content::text, 100) as content_preview,
    CASE 
        WHEN m.content::text LIKE '{%' THEN 
            (m.content::jsonb->>'role')
        ELSE m.type 
    END as role,
    m.created_at
FROM messages m
JOIN threads t ON m.thread_id = t.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY m.created_at DESC
LIMIT 20;

-- Check agent runs status
SELECT 
    ar.agent_run_id,
    ar.agent_id,
    ar.thread_id,
    ar.status,
    ar.error,
    ar.started_at,
    ar.completed_at,
    EXTRACT(EPOCH FROM (ar.completed_at - ar.started_at)) as duration_seconds
FROM agent_runs ar
WHERE ar.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY ar.created_at DESC
LIMIT 10;

-- Count messages by type
SELECT 
    m.type,
    COUNT(*) as count
FROM messages m
JOIN threads t ON m.thread_id = t.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
  AND m.created_at > NOW() - INTERVAL '1 day'
GROUP BY m.type;