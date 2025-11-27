-- Migration to remove remaining Suna references in agent system prompts
-- Replaces any remaining "Suna" with "Prophet"

UPDATE agent_versions
SET config = jsonb_set(
    config,
    '{system_prompt}',
    to_jsonb(
        regexp_replace(
            config->>'system_prompt',
            'Suna',
            'Prophet',
            'g'
        )
    )
)
WHERE config->>'system_prompt' IS NOT NULL
  AND config->>'system_prompt' ILIKE '%Suna%';

