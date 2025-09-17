-- Check the actual structure of agent_runs table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_runs'
ORDER BY ordinal_position;

-- Check if we need to rename columns
SELECT * FROM agent_runs LIMIT 1;