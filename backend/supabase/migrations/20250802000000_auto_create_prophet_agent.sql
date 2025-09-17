-- Migration to automatically create Prophet agent for new users
BEGIN;

-- Function to create Prophet agent for a user
CREATE OR REPLACE FUNCTION create_prophet_agent_for_user(p_account_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
BEGIN
    -- Check if user already has a Prophet agent
    SELECT agent_id INTO v_agent_id
    FROM agents
    WHERE account_id = p_account_id
    AND (name = 'Prophet' OR (metadata->>'is_suna_default')::boolean = true)
    LIMIT 1;
    
    -- If agent exists, return its ID
    IF v_agent_id IS NOT NULL THEN
        RETURN v_agent_id;
    END IF;
    
    -- Create new Prophet agent
    INSERT INTO agents (
        account_id,
        name,
        description,
        avatar,
        avatar_color,
        is_default,
        config,
        metadata,
        version_count,
        tags
    ) VALUES (
        p_account_id,
        'Prophet',
        'Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.',
        '🔮',
        '#8B5CF6',
        true,
        jsonb_build_object(
            'tools', jsonb_build_object(
                'agentpress', jsonb_build_object(
                    'sb_files_tool', true,
                    'sb_shell_tool', true,
                    'sb_deploy_tool', true,
                    'sb_expose_tool', true,
                    'sb_vision_tool', true,
                    'sb_browser_tool', true,
                    'web_search_tool', true,
                    'sb_image_edit_tool', true,
                    'data_providers_tool', true
                ),
                'mcp', '[]'::jsonb,
                'custom_mcp', '[]'::jsonb
            ),
            'metadata', jsonb_build_object(
                'avatar', '🔮',
                'avatar_color', '#8B5CF6'
            ),
            'system_prompt', 'You are Prophet, an AI assistant. Be helpful, accurate, and concise.'
        ),
        jsonb_build_object(
            'is_suna_default', true,
            'centrally_managed', true,
            'installation_date', NOW(),
            'last_central_update', NOW(),
            'restrictions', jsonb_build_object(
                'name_editable', false,
                'tools_editable', false,
                'mcps_editable', true,
                'description_editable', true,
                'system_prompt_editable', false
            )
        ),
        1,
        ARRAY[]::text[]
    )
    RETURNING agent_id INTO v_agent_id;
    
    RETURN v_agent_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating Prophet agent for account %: %', p_account_id, SQLERRM;
        RETURN NULL;
END;
$$;

-- Trigger function to create Prophet agent when a new account is created
CREATE OR REPLACE FUNCTION handle_new_account_prophet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
BEGIN
    -- Only create Prophet for personal accounts
    IF NEW.personal_account = true THEN
        -- Small delay to ensure account is fully created
        PERFORM pg_sleep(0.1);
        
        -- Create Prophet agent
        v_agent_id := create_prophet_agent_for_user(NEW.id);
        
        IF v_agent_id IS NOT NULL THEN
            RAISE LOG 'Prophet agent created for account %', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new accounts
DROP TRIGGER IF EXISTS create_prophet_on_new_account ON accounts;
CREATE TRIGGER create_prophet_on_new_account
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_account_prophet();

-- Function to install Prophet for all existing users who don't have it
CREATE OR REPLACE FUNCTION install_prophet_for_all_users()
RETURNS TABLE (
    account_id UUID,
    account_name TEXT,
    agent_id UUID,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account RECORD;
    v_agent_id UUID;
BEGIN
    -- Loop through all personal accounts
    FOR v_account IN 
        SELECT a.id, a.name
        FROM accounts a
        WHERE a.personal_account = true
        AND NOT EXISTS (
            SELECT 1 
            FROM agents ag 
            WHERE ag.account_id = a.id 
            AND (ag.name = 'Prophet' OR (ag.metadata->>'is_suna_default')::boolean = true)
        )
    LOOP
        BEGIN
            -- Try to create Prophet for this account
            v_agent_id := create_prophet_agent_for_user(v_account.id);
            
            IF v_agent_id IS NOT NULL THEN
                RETURN QUERY SELECT v_account.id, v_account.name, v_agent_id, 'success'::TEXT;
            ELSE
                RETURN QUERY SELECT v_account.id, v_account.name, NULL::UUID, 'failed'::TEXT;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RETURN QUERY SELECT v_account.id, v_account.name, NULL::UUID, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_prophet_agent_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION install_prophet_for_all_users() TO authenticated;

-- Comentário sobre como executar a instalação para usuários existentes:
-- SELECT * FROM install_prophet_for_all_users();

COMMIT;