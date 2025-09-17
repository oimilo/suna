-- Check thread and project mismatch issue

-- 1. Find the specific thread
SELECT 
    thread_id,
    project_id,
    account_id,
    created_at
FROM threads
WHERE thread_id = '07f47dcc-aa0e-4dda-bb69-a1d5e305a51c';

-- 2. Check if the project exists
SELECT 
    project_id,
    name,
    account_id,
    created_at
FROM projects
WHERE project_id = 'ffdfcd08-1ff3-4296-9a45-20d12c2a1d87';

-- 3. Find orphan threads (threads without corresponding projects)
SELECT 
    t.thread_id,
    t.project_id,
    t.account_id as thread_account_id,
    t.created_at,
    p.project_id as found_project,
    p.account_id as project_account_id
FROM threads t
LEFT JOIN projects p ON t.project_id = p.project_id
WHERE p.project_id IS NULL
ORDER BY t.created_at DESC
LIMIT 10;

-- 4. Count threads by account_id
SELECT 
    account_id,
    COUNT(*) as thread_count
FROM threads
GROUP BY account_id
ORDER BY thread_count DESC;