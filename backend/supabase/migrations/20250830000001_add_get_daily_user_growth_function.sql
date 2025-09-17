-- Add function for getting daily user growth
BEGIN;

CREATE OR REPLACE FUNCTION get_daily_user_growth(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    timestamp DATE,
    value BIGINT,
    label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
    ),
    daily_counts AS (
        SELECT 
            ds.date,
            COUNT(a.id) AS user_count
        FROM date_series ds
        LEFT JOIN accounts a ON DATE(a.created_at) <= ds.date
        GROUP BY ds.date
    )
    SELECT 
        dc.date AS timestamp,
        dc.user_count AS value,
        TO_CHAR(dc.date, 'Mon DD') AS label
    FROM daily_counts dc
    ORDER BY dc.date;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_daily_user_growth(DATE, DATE) TO authenticated;

COMMIT;