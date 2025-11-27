-- Migration to rebrand agent system prompts from Suna.so/Kortix to Prophet/Milo
-- This updates the system_prompt inside the config JSONB column in agent_versions table

-- Update system_prompt in the 'agent_versions' table
UPDATE agent_versions
SET config = jsonb_set(
    config,
    '{system_prompt}',
    to_jsonb(
        regexp_replace(
            regexp_replace(
                config->>'system_prompt',
                'You are Suna\.so, an autonomous AI Worker created by the Kortix team',
                'You are Prophet, an autonomous AI Worker created by the Milo team',
                'g'
            ),
            'Suna\.so',
            'Prophet',
            'g'
        )
    )
)
WHERE config->>'system_prompt' IS NOT NULL
  AND (config->>'system_prompt' ILIKE '%Suna%' OR config->>'system_prompt' ILIKE '%Kortix%');

