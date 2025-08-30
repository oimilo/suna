-- Admin System Tables and Functions
BEGIN;

-- =============================================
-- Admin Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- =============================================
-- Admin Action Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    action_type TEXT CHECK (action_type IN ('create', 'update', 'delete', 'view', 'export', 'system')),
    target_type TEXT, -- 'user', 'subscription', 'credits', 'system', etc
    target_id UUID,
    target_user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id ON admin_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_type ON admin_logs(target_type);

-- =============================================
-- Analytics Cache Table
-- =============================================
CREATE TABLE IF NOT EXISTS analytics_cache (
    metric_key TEXT PRIMARY KEY,
    metric_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'realtime'
    value JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_cache_metric_type ON analytics_cache(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- =============================================
-- User Analytics Table (for detailed tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    credits_used DECIMAL(10, 2) DEFAULT 0,
    tools_executed INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    total_session_duration INTEGER DEFAULT 0, -- in seconds
    active_time INTEGER DEFAULT 0, -- in seconds
    models_used JSONB DEFAULT '[]'::jsonb,
    features_used JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date DESC);

-- =============================================
-- System Health Metrics Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    service_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('healthy', 'degraded', 'down')),
    response_time_ms INTEGER,
    error_rate DECIMAL(5, 2),
    cpu_usage DECIMAL(5, 2),
    memory_usage DECIMAL(5, 2),
    active_connections INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health_metrics(service_name, timestamp DESC);

-- =============================================
-- Helper Functions
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM admin_users 
        WHERE user_id = check_user_id 
        AND is_active = true
    ) INTO admin_exists;
    
    RETURN admin_exists;
END;
$$;

-- Function to check admin role level
CREATE OR REPLACE FUNCTION get_admin_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM admin_users 
    WHERE user_id = check_user_id 
    AND is_active = true;
    
    RETURN user_role;
END;
$$;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action TEXT,
    p_action_type TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_target_user_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_logs (
        admin_id, action, action_type, target_type, 
        target_id, target_user_id, metadata, success, error_message
    ) VALUES (
        p_admin_id, p_action, p_action_type, p_target_type,
        p_target_id, p_target_user_id, p_metadata, p_success, p_error_message
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(
    p_user_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    user_id UUID,
    total_messages BIGINT,
    total_tokens BIGINT,
    total_credits DECIMAL,
    total_sessions BIGINT,
    avg_session_duration DECIMAL,
    last_active TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.user_id,
        SUM(ua.messages_sent)::BIGINT as total_messages,
        SUM(ua.tokens_used)::BIGINT as total_tokens,
        SUM(ua.credits_used)::DECIMAL as total_credits,
        SUM(ua.session_count)::BIGINT as total_sessions,
        CASE 
            WHEN SUM(ua.session_count) > 0 
            THEN (SUM(ua.total_session_duration) / SUM(ua.session_count))::DECIMAL
            ELSE 0
        END as avg_session_duration,
        MAX(ua.updated_at) as last_active
    FROM user_analytics ua
    WHERE (p_user_id IS NULL OR ua.user_id = p_user_id)
    AND ua.date BETWEEN p_start_date AND p_end_date
    GROUP BY ua.user_id;
END;
$$;

-- Function to get system-wide analytics
CREATE OR REPLACE FUNCTION get_system_analytics(
    p_period TEXT DEFAULT 'day' -- 'hour', 'day', 'week', 'month'
)
RETURNS TABLE (
    period_start TIMESTAMPTZ,
    active_users BIGINT,
    total_messages BIGINT,
    total_tokens BIGINT,
    total_credits DECIMAL,
    total_errors BIGINT,
    avg_response_time DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH period_data AS (
        SELECT 
            date_trunc(p_period, ua.created_at) as period,
            ua.user_id,
            ua.messages_sent,
            ua.tokens_used,
            ua.credits_used,
            ua.errors_count
        FROM user_analytics ua
        WHERE ua.date >= CURRENT_DATE - CASE 
            WHEN p_period = 'hour' THEN INTERVAL '24 hours'
            WHEN p_period = 'day' THEN INTERVAL '30 days'
            WHEN p_period = 'week' THEN INTERVAL '12 weeks'
            WHEN p_period = 'month' THEN INTERVAL '12 months'
            ELSE INTERVAL '30 days'
        END
    )
    SELECT 
        period as period_start,
        COUNT(DISTINCT user_id)::BIGINT as active_users,
        SUM(messages_sent)::BIGINT as total_messages,
        SUM(tokens_used)::BIGINT as total_tokens,
        SUM(credits_used)::DECIMAL as total_credits,
        SUM(errors_count)::BIGINT as total_errors,
        0::DECIMAL as avg_response_time -- Placeholder, will be calculated from actual response times
    FROM period_data
    GROUP BY period
    ORDER BY period DESC;
END;
$$;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admin users are viewable by admins" ON admin_users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users" ON admin_users
    FOR ALL USING (get_admin_role(auth.uid()) = 'super_admin');

-- Admin logs policies
CREATE POLICY "Admin logs are viewable by admins" ON admin_logs
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
    );

-- Analytics cache policies
CREATE POLICY "Analytics cache is viewable by admins" ON analytics_cache
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can manage analytics cache" ON analytics_cache
    FOR ALL USING (auth.uid() IS NOT NULL);

-- User analytics policies
CREATE POLICY "User analytics viewable by admins" ON user_analytics
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own analytics" ON user_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- System health metrics policies
CREATE POLICY "System health viewable by admins" ON system_health_metrics
    FOR SELECT USING (is_admin(auth.uid()));

-- =============================================
-- Triggers for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at 
    BEFORE UPDATE ON user_analytics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Initial Super Admin Setup (Optional)
-- =============================================
-- Uncomment and modify the email to create the first super admin
-- INSERT INTO admin_users (user_id, role, created_by)
-- SELECT id, 'super_admin', id
-- FROM auth.users
-- WHERE email = 'admin@sunaai.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- Grant Permissions
-- =============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;