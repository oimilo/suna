-- SCRIPT COMPLETO PARA INSTALAR PROPHET PARA TODOS OS USUÁRIOS
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, criar a função de instalação do Prophet (versão corrigida)
CREATE OR REPLACE FUNCTION install_prophet_agent_for_user(user_account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_agent_id UUID;
BEGIN
    -- Verificar se já existe um agente Prophet para este usuário
    IF EXISTS (
        SELECT 1 FROM agents 
        WHERE account_id = user_account_id 
        AND metadata->>'is_suna_default' = 'true'
    ) THEN
        RAISE NOTICE 'Prophet agent already exists for account %', user_account_id;
        RETURN;
    END IF;

    -- Generate new UUID
    new_agent_id := gen_random_uuid();
    
    -- Create the Prophet agent for this account
    INSERT INTO agents (
        agent_id,
        account_id,
        name,
        description,
        is_default,
        avatar,
        avatar_color,
        config,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        new_agent_id,
        user_account_id,
        'Prophet',
        'Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.',
        true,
        '🌞',
        '#F59E0B',
        jsonb_build_object(
            'tools', jsonb_build_object(
                'mcp', '[]'::jsonb,
                'custom_mcp', '[]'::jsonb,
                'agentpress', jsonb_build_object()
            ),
            'metadata', jsonb_build_object(
                'is_suna_default', true,
                'centrally_managed', true
            )
        ),
        jsonb_build_object(
            'is_suna_default', true,
            'centrally_managed', true,
            'restrictions', jsonb_build_object(
                'system_prompt_editable', false,
                'tools_editable', false,
                'name_editable', false,
                'description_editable', true,
                'mcps_editable', true
            ),
            'installation_date', NOW(),
            'last_central_update', NOW()
        ),
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Prophet agent % created for account %', new_agent_id, user_account_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating Prophet agent for account %: %', user_account_id, SQLERRM;
        RAISE;
END;
$$;

-- 2. Atualizar a função de setup de novos usuários
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    first_account_id    uuid;
    generated_user_name text;
BEGIN
    -- First we setup the user profile
    IF new.email IS NOT NULL THEN
        generated_user_name := split_part(new.email, '@', 1);
    END IF;

    INSERT INTO basejump.profiles (id, name)
    VALUES (new.id, generated_user_name);

    -- Then we create the first account for the user
    INSERT INTO basejump.accounts (primary_owner_user_id, name, personal_account, id)
    VALUES (new.id, generated_user_name, true, new.id)
    RETURNING id INTO first_account_id;

    -- Add the user to the account_user table so they can act on it
    INSERT INTO basejump.account_user (account_id, user_id, account_role)
    VALUES (first_account_id, new.id, 'owner');
    
    -- Install Prophet agent for the new user
    -- IMPORTANTE: Usar o account_id (que é igual ao user_id para contas pessoais)
    BEGIN
        PERFORM install_prophet_agent_for_user(new.id);
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to install Prophet for new user %: %', new.id, SQLERRM;
    END;

    RETURN new;
END;
$$;

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION install_prophet_agent_for_user(UUID) TO service_role;

-- 4. INSTALAR PROPHET PARA TODOS OS USUÁRIOS EXISTENTES QUE NÃO TÊM
DO $$
DECLARE
    user_record RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting Prophet installation for existing users...';
    
    -- Loop através de todos os usuários que não têm o Prophet
    FOR user_record IN 
        SELECT DISTINCT 
            au.id as user_id,
            au.email
        FROM auth.users au
        WHERE NOT EXISTS (
            SELECT 1 
            FROM agents a 
            WHERE a.account_id = au.id 
            AND a.metadata->>'is_suna_default' = 'true'
        )
        ORDER BY au.created_at DESC
    LOOP
        BEGIN
            -- Instalar Prophet para este usuário
            PERFORM install_prophet_agent_for_user(user_record.user_id);
            success_count := success_count + 1;
            RAISE NOTICE 'Successfully installed Prophet for user % (%)', user_record.user_id, user_record.email;
        EXCEPTION 
            WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE 'Failed to install Prophet for user % (%): %', user_record.user_id, user_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Prophet installation completed. Success: %, Errors: %', success_count, error_count;
END $$;

-- 5. Verificar resultados
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN has_prophet THEN 1 END) as users_with_prophet,
    COUNT(CASE WHEN NOT has_prophet THEN 1 END) as users_without_prophet
FROM (
    SELECT 
        au.id,
        au.email,
        EXISTS (
            SELECT 1 
            FROM agents a 
            WHERE a.account_id = au.id 
            AND a.metadata->>'is_suna_default' = 'true'
        ) as has_prophet
    FROM auth.users au
) user_prophet_status;