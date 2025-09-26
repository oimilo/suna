-- Idempotent backfill to mark automation threads based on agent_runs metadata
BEGIN;

-- Ensure metadata column and index exist (safety; no-op if already applied)
ALTER TABLE threads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_threads_metadata ON threads USING GIN (metadata);

-- Mark threads linked to agent_runs that have trigger_execution=true
UPDATE threads t
SET metadata = COALESCE(t.metadata, '{}'::jsonb) || jsonb_build_object('is_automation', true)
FROM agent_runs ar
WHERE ar.thread_id = t.thread_id
  AND (ar.metadata ->> 'trigger_execution')::boolean IS TRUE
  AND (t.metadata ->> 'is_automation') IS NULL;

COMMIT;

