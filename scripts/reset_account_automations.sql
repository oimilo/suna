-- Reset automation-related data (credentials, triggers, workflows, legacy MCP configs)
-- for a single account so we can migrate from the old Pipedream flow to Composio.
--
-- Usage:
--   1. Replace the value of target_account with the account_id you want to reset.
--      For start@prophet.build the account_id is 29e38efa-512a-47c0-9130-0ca0cedeb533.
--   2. Run this script in the Supabase SQL editor or via supabase db execute.
--   3. Re-run the new credential / trigger setup from the app after execution.
--
-- The script is defensive: it skips sections if the related tables are absent.

DO $reset$
DECLARE
  target_account CONSTANT UUID := '29e38efa-512a-47c0-9130-0ca0cedeb533';
  has_agent_triggers BOOLEAN;
  has_agent_workflows BOOLEAN;
  has_user_credentials BOOLEAN;
  has_credential_profiles BOOLEAN;
BEGIN
  RAISE NOTICE 'Resetting automations for account %', target_account;

  -- Check table availability upfront to avoid parse errors on older schemas.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agent_triggers'
  ) INTO has_agent_triggers;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agent_workflows'
  ) INTO has_agent_workflows;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_mcp_credentials'
  ) INTO has_user_credentials;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_mcp_credential_profiles'
  ) INTO has_credential_profiles;

  IF has_agent_triggers THEN
    RAISE NOTICE '→ Removing agent_triggers (and cascading trigger events / OAuth installs)';
    EXECUTE '
      DELETE FROM agent_triggers
      WHERE agent_id IN (
        SELECT agent_id FROM agents WHERE account_id = $1
      )
    ' USING target_account;
  ELSE
    RAISE NOTICE '→ Skipped agent_triggers cleanup (table not present)';
  END IF;

  IF has_agent_workflows THEN
    RAISE NOTICE '→ Removing agent_workflows (steps/executions cascade automatically)';
    EXECUTE '
      DELETE FROM agent_workflows
      WHERE agent_id IN (
        SELECT agent_id FROM agents WHERE account_id = $1
      )
    ' USING target_account;
  ELSE
    RAISE NOTICE '→ Skipped agent_workflows cleanup (table not present)';
  END IF;

  IF has_credential_profiles THEN
    RAISE NOTICE '→ Removing credential profiles (user_mcp_credential_profiles)';
    EXECUTE '
      DELETE FROM user_mcp_credential_profiles
      WHERE account_id = $1
    ' USING target_account;
  ELSE
    RAISE NOTICE '→ Skipped credential profile cleanup (table not present)';
  END IF;

  IF has_user_credentials THEN
    RAISE NOTICE '→ Removing legacy user_mcp_credentials records';
    EXECUTE '
      DELETE FROM user_mcp_credentials
      WHERE account_id = $1
    ' USING target_account;
  ELSE
    RAISE NOTICE '→ Skipped legacy user_mcp_credentials cleanup (table not present)';
  END IF;

  -- Remove Pipedream artefacts from agent configs (both legacy columns and unified config JSON).
  RAISE NOTICE '→ Scrubbing Pipedream MCP references from agents + versions';

  -- Agents table.
  UPDATE agents
  SET
    config = jsonb_set(
      jsonb_set(
        COALESCE(config, '{}'::jsonb),
        '{tools,mcp}',
        COALESCE(
          (
            SELECT jsonb_agg(elem)
            FROM jsonb_array_elements(COALESCE(config -> 'tools' -> 'mcp', '[]'::jsonb)) elem
            WHERE elem::text NOT ILIKE '%pipedream%'
          ),
          '[]'::jsonb
        ),
        true
      ),
      '{tools,custom_mcp}',
      COALESCE(
        (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(COALESCE(config -> 'tools' -> 'custom_mcp', '[]'::jsonb)) elem
          WHERE elem::text NOT ILIKE '%pipedream%'
        ),
        '[]'::jsonb
      ),
      true
    ),
    configured_mcps = COALESCE(
      (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(configured_mcps, '[]'::jsonb)) elem
        WHERE elem::text NOT ILIKE '%pipedream%'
      ),
      '[]'::jsonb
    ),
    custom_mcps = COALESCE(
      (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(custom_mcps, '[]'::jsonb)) elem
        WHERE elem::text NOT ILIKE '%pipedream%'
      ),
      '[]'::jsonb
    )
  WHERE account_id = target_account;

  -- Agent versions table.
  UPDATE agent_versions
  SET
    config = jsonb_set(
      jsonb_set(
        COALESCE(config, '{}'::jsonb),
        '{tools,mcp}',
        COALESCE(
          (
            SELECT jsonb_agg(elem)
            FROM jsonb_array_elements(COALESCE(config -> 'tools' -> 'mcp', '[]'::jsonb)) elem
            WHERE elem::text NOT ILIKE '%pipedream%'
          ),
          '[]'::jsonb
        ),
        true
      ),
      '{tools,custom_mcp}',
      COALESCE(
        (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements(COALESCE(config -> 'tools' -> 'custom_mcp', '[]'::jsonb)) elem
          WHERE elem::text NOT ILIKE '%pipedream%'
        ),
        '[]'::jsonb
      ),
      true
    ),
    configured_mcps = COALESCE(
      (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(configured_mcps, '[]'::jsonb)) elem
        WHERE elem::text NOT ILIKE '%pipedream%'
      ),
      '[]'::jsonb
    ),
    custom_mcps = COALESCE(
      (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(COALESCE(custom_mcps, '[]'::jsonb)) elem
        WHERE elem::text NOT ILIKE '%pipedream%'
      ),
      '[]'::jsonb
    )
  WHERE agent_id IN (
    SELECT agent_id FROM agents WHERE account_id = target_account
  );

  RAISE NOTICE 'Reset completed for account %', target_account;
END;
$reset$;
