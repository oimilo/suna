-- 1. Check recent agent runs with details
SELECT 
    ar.agent_run_id,
    ar.agent_id,
    ar.thread_id,
    ar.status,
    ar.error,
    ar.started_at,
    ar.completed_at,
    ar.metadata,
    a.name as agent_name
FROM agent_runs ar
LEFT JOIN agents a ON ar.agent_id = a.agent_id
WHERE ar.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY ar.created_at DESC
LIMIT 10;

-- 2. Check if we have any agents
SELECT 
    agent_id,
    name,
    account_id,
    is_public,
    created_at
FROM agents
WHERE account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596';

-- 3. Check recent messages with more details
SELECT 
    m.message_id,
    m.thread_id,
    m.type,
    m.agent_id,
    CASE 
        WHEN m.content::text LIKE '{%' THEN 
            jsonb_pretty(m.content)
        ELSE m.content::text 
    END as content_formatted,
    m.created_at
FROM messages m
WHERE m.thread_id IN (
    SELECT DISTINCT thread_id 
    FROM threads 
    WHERE account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
)
ORDER BY m.created_at DESC
LIMIT 5;

-- 4. Check if threads have agent_id set
SELECT 
    t.thread_id,
    t.agent_id,
    t.project_id,
    COUNT(m.message_id) as message_count
FROM threads t
LEFT JOIN messages m ON t.thread_id = m.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
GROUP BY t.thread_id, t.agent_id, t.project_id
ORDER BY t.created_at DESC
LIMIT 5;