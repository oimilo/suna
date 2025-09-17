-- Check specific thread issue
-- Thread f157e5c4-235b-4b81-8732-b94f2191aa8a has project_id=0155a452-0bc1-407a-a3ca-b291b8c8af9f

-- 1. Check the thread
SELECT 
    thread_id,
    project_id,
    account_id,
    created_at
FROM threads
WHERE thread_id = 'f157e5c4-235b-4b81-8732-b94f2191aa8a';

-- 2. Check if project exists
SELECT 
    project_id,
    name,
    account_id,
    created_at
FROM projects
WHERE project_id = '0155a452-0bc1-407a-a3ca-b291b8c8af9f';

-- 3. Check all threads for admin@oimilo.com
SELECT 
    t.thread_id,
    t.project_id,
    t.account_id,
    t.created_at,
    p.project_id as found_project
FROM threads t
LEFT JOIN projects p ON t.project_id = p.project_id
WHERE t.account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY t.created_at DESC;

-- 4. Check all projects for admin@oimilo.com
SELECT 
    project_id,
    name,
    account_id,
    created_at
FROM projects
WHERE account_id = '0fabc038-dab7-44d7-a3f3-fe0463180596'
ORDER BY created_at DESC;