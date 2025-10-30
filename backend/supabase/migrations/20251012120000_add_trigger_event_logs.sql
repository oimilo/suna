-- Create trigger_event_logs table for detailed automation logging
-- Aligns Supabase schema with the new trigger service implementation

BEGIN;

-- Ensure uuid extension is available for default IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS trigger_event_logs (
    log_id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    trigger_id UUID NOT NULL REFERENCES agent_triggers(trigger_id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    trigger_type agent_trigger_type NOT NULL,
    event_data TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    should_execute_agent BOOLEAN DEFAULT FALSE,
    should_execute_workflow BOOLEAN DEFAULT FALSE,
    agent_prompt TEXT,
    execution_variables JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trigger_event_logs_trigger_id ON trigger_event_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_trigger_event_logs_agent_id ON trigger_event_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_trigger_event_logs_logged_at ON trigger_event_logs(logged_at DESC);

ALTER TABLE trigger_event_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read logs for agents they have access to
CREATE POLICY trigger_event_logs_select_policy ON trigger_event_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE agents.agent_id = trigger_event_logs.agent_id
              AND basejump.has_role_on_account(agents.account_id)
        )
    );

-- Service role (backend) inserts/updates/deletes logs
CREATE POLICY trigger_event_logs_service_insert ON trigger_event_logs
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY trigger_event_logs_service_update ON trigger_event_logs
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY trigger_event_logs_service_delete ON trigger_event_logs
    FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

GRANT SELECT ON TABLE trigger_event_logs TO authenticated;
GRANT ALL PRIVILEGES ON TABLE trigger_event_logs TO service_role;

COMMENT ON TABLE trigger_event_logs IS 'Detailed audit log for automation triggers (agent + workflow executions).';
COMMENT ON COLUMN trigger_event_logs.execution_variables IS 'Captured variables/context passed to agent or workflow during execution.';

COMMIT;

