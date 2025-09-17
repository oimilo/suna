-- Functions for trigger statistics
BEGIN;

-- Function to get execution statistics for multiple triggers
CREATE OR REPLACE FUNCTION get_trigger_execution_stats(trigger_ids UUID[])
RETURNS TABLE (
    trigger_id UUID,
    last_execution TIMESTAMP WITH TIME ZONE,
    execution_count BIGINT,
    success_count BIGINT,
    failure_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.trigger_id,
        MAX(te.timestamp) as last_execution,
        COUNT(*)::BIGINT as execution_count,
        COUNT(CASE WHEN te.success = true THEN 1 END)::BIGINT as success_count,
        COUNT(CASE WHEN te.success = false THEN 1 END)::BIGINT as failure_count
    FROM trigger_events te
    WHERE te.trigger_id = ANY(trigger_ids)
    GROUP BY te.trigger_id;
END;
$$;

-- Function to get user trigger statistics with time ranges
CREATE OR REPLACE FUNCTION get_user_trigger_stats(
    trigger_ids UUID[],
    user_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
    executions_today BIGINT,
    executions_this_week BIGINT,
    executions_this_month BIGINT,
    total_executions BIGINT,
    total_success BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    today_start TIMESTAMP WITH TIME ZONE;
    week_start TIMESTAMP WITH TIME ZONE;
    month_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate time boundaries in user's timezone
    today_start := date_trunc('day', NOW() AT TIME ZONE user_timezone) AT TIME ZONE user_timezone;
    week_start := date_trunc('week', NOW() AT TIME ZONE user_timezone) AT TIME ZONE user_timezone;
    month_start := date_trunc('month', NOW() AT TIME ZONE user_timezone) AT TIME ZONE user_timezone;
    
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN te.timestamp >= today_start THEN 1 END)::BIGINT as executions_today,
        COUNT(CASE WHEN te.timestamp >= week_start THEN 1 END)::BIGINT as executions_this_week,
        COUNT(CASE WHEN te.timestamp >= month_start THEN 1 END)::BIGINT as executions_this_month,
        COUNT(*)::BIGINT as total_executions,
        COUNT(CASE WHEN te.success = true THEN 1 END)::BIGINT as total_success
    FROM trigger_events te
    WHERE te.trigger_id = ANY(trigger_ids);
END;
$$;

-- Index for better performance on trigger_events queries
CREATE INDEX IF NOT EXISTS idx_trigger_events_trigger_id_timestamp 
    ON trigger_events(trigger_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trigger_events_trigger_id_success 
    ON trigger_events(trigger_id, success);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_trigger_execution_stats(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_trigger_stats(UUID[], TEXT) TO authenticated;

COMMIT;