-- Check the structure of basejump billing tables

-- List all tables in basejump schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'basejump'
ORDER BY table_name;

-- Check columns in billing_customers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'basejump' 
  AND table_name = 'billing_customers'
ORDER BY ordinal_position;

-- Check columns in billing_subscriptions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'basejump' 
  AND table_name = 'billing_subscriptions'
ORDER BY ordinal_position;