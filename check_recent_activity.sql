-- Check all recent activity for debugging

-- 1. Recent messages (last hour)
SELECT 
    m.message_id,
    m.thread_id,
    m.type,
    m.created_at,
    LEFT(m.content::text, 100) as content_preview
FROM messages m
WHERE m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC;

-- 2. Recent agent runs (last hour)
SELECT 
    ar.agent_run_id,
    ar.thread_id,
    ar.status,
    ar.error,
    ar.created_at,
    ar.completed_at
FROM agent_runs ar
WHERE ar.created_at > NOW() - INTERVAL '1 hour'
ORDER BY ar.created_at DESC;

-- 3. Check if agent exists for user
SELECT 
    a.agent_id,
    a.name,
    a.account_id,
    a.created_at
FROM agents a
WHERE a.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596';

-- 4. Check thread details
SELECT 
    t.thread_id,
    t.agent_id,
    t.project_id,
    t.account_id,
    t.created_at,
    COUNT(m.message_id) as message_count
FROM threads t
LEFT JOIN messages m ON t.thread_id = m.thread_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
  AND t.created_at > NOW() - INTERVAL '1 day'
GROUP BY t.thread_id, t.agent_id, t.project_id, t.account_id, t.created_at
ORDER BY t.created_at DESC;