-- Verificar se existe o agente com o ID específico
SELECT 
    agent_id,
    name,
    is_default,
    account_id,
    created_at
FROM agents 
WHERE agent_id = '827ea863-7cf6-4b67-b449-df9b386cdf00';

-- Verificar agentes padrão
SELECT 
    agent_id,
    name,
    is_default,
    account_id,
    created_at
FROM agents 
WHERE is_default = true
ORDER BY created_at DESC;

-- Verificar se há algum agente chamado Prophet ou Suna
SELECT 
    agent_id,
    name,
    is_default,
    account_id,
    created_at
FROM agents 
WHERE name ILIKE '%prophet%' OR name ILIKE '%suna%'
ORDER BY created_at DESC;