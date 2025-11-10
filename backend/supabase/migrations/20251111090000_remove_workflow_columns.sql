-- Align agent_triggers schema with upstream (no workflow execution support)
BEGIN;

ALTER TABLE agent_triggers
    DROP COLUMN IF EXISTS execution_type,
    DROP COLUMN IF EXISTS workflow_id;

COMMIT;

