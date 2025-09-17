-- Script para criar um agente Agent Builder dedicado

-- Primeiro, verificar se já existe
SELECT * FROM agents WHERE name = 'Agent Builder';

-- Se não existir, criar:
INSERT INTO agents (
    agent_id,
    account_id,
    name,
    description,
    system_prompt,
    is_default,
    is_public,
    created_at,
    updated_at,
    config,
    metadata
) VALUES (
    gen_random_uuid(),
    (SELECT account_id FROM accounts LIMIT 1), -- Usar primeira conta ou especificar
    'Agent Builder',
    'AI assistant specialized in helping you create and configure custom agents',
    '', -- Será sobrescrito pelo prompt do agent builder
    false,
    false,
    NOW(),
    NOW(),
    '{
        "tools": {
            "agentpress_tools": {}
        }
    }'::jsonb,
    '{
        "is_agent_builder": true,
        "special_purpose": true
    }'::jsonb
);