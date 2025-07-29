-- Drop the old function
DROP FUNCTION IF EXISTS install_prophet_agent_for_user(UUID);

-- Create corrected function to install Prophet agent for new users
CREATE OR REPLACE FUNCTION install_prophet_agent_for_user(user_account_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_agent_id UUID;
    new_version_id UUID;
    system_prompt_text TEXT;
BEGIN
    -- Generate new UUIDs
    new_agent_id := gen_random_uuid();
    new_version_id := gen_random_uuid();
    
    -- Define the system prompt
    system_prompt_text := 'You are Prophet, an AI assistant with access to various tools and integrations. Be helpful, accurate, and concise in your responses.';
    
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
        user_account_id, -- Use the actual account_id passed as parameter
        'Prophet',
        'Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.',
        true,
        '🌞',
        '#F59E0B',
        jsonb_build_object(
            'system_prompt', system_prompt_text,
            'tools', jsonb_build_object(
                'mcp', '[]'::jsonb,
                'custom_mcp', '[]'::jsonb,
                'agentpress', jsonb_build_object(
                    'sb_shell_tool', true,
                    'sb_files_tool', true,
                    'sb_browser_tool', true,
                    'sb_deploy_tool', true,
                    'sb_expose_tool', true,
                    'web_search_tool', true,
                    'sb_vision_tool', true,
                    'sb_image_edit_tool', true,
                    'data_providers_tool', true
                )
            ),
            'metadata', jsonb_build_object(
                'avatar', '🌞',
                'avatar_color', '#F59E0B'
            )
        ),
        jsonb_build_object(
            'is_suna_default', true,
            'centrally_managed', true,
            'management_version', '1.0.0',
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
    
    -- Create initial version for the agent
    INSERT INTO agent_versions (
        version_id,
        agent_id,
        version_number,
        version_name,
        system_prompt,
        configured_mcps,
        custom_mcps,
        agentpress_tools,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        new_version_id,
        new_agent_id,
        1,
        'Initial Version',
        system_prompt_text,
        '[]'::jsonb,
        '[]'::jsonb,
        jsonb_build_object(
            'sb_shell_tool', jsonb_build_object('enabled', true, 'description', 'Execute shell commands'),
            'sb_files_tool', jsonb_build_object('enabled', true, 'description', 'Read, write, and edit files'),
            'sb_browser_tool', jsonb_build_object('enabled', true, 'description', 'Browse websites and interact with web pages'),
            'sb_deploy_tool', jsonb_build_object('enabled', true, 'description', 'Deploy web applications'),
            'sb_expose_tool', jsonb_build_object('enabled', true, 'description', 'Expose local services to the internet'),
            'web_search_tool', jsonb_build_object('enabled', true, 'description', 'Search the web for information'),
            'sb_vision_tool', jsonb_build_object('enabled', true, 'description', 'Analyze and understand images'),
            'sb_image_edit_tool', jsonb_build_object('enabled', true, 'description', 'Edit and manipulate images'),
            'data_providers_tool', jsonb_build_object('enabled', true, 'description', 'Access structured data from various providers')
        ),
        true,
        NOW(),
        NOW()
    );
    
    -- Update agent to use this version
    UPDATE agents 
    SET current_version_id = new_version_id 
    WHERE agent_id = new_agent_id;
    
END;
$$;

-- Override the existing user setup function to include Prophet agent creation
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
    
    -- Install Prophet agent for the new user's account
    -- Pass the account_id, not the user_id
    PERFORM install_prophet_agent_for_user(first_account_id);

    RETURN new;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION install_prophet_agent_for_user(UUID) TO service_role;

-- Install Prophet for existing accounts that don't have it
DO $$
DECLARE
    account_record RECORD;
BEGIN
    -- Loop through all accounts that don't have the Prophet agent
    FOR account_record IN 
        SELECT DISTINCT a.id as account_id 
        FROM accounts a
        WHERE NOT EXISTS (
            SELECT 1 
            FROM agents ag 
            WHERE ag.account_id = a.id 
            AND ag.metadata->>'is_suna_default' = 'true'
        )
        AND a.personal_account = true  -- Only for personal accounts
    LOOP
        BEGIN
            -- Install Prophet agent for this account
            PERFORM install_prophet_agent_for_user(account_record.account_id);
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to install Prophet for account %: %', account_record.account_id, SQLERRM;
        END;
    END LOOP;
END $$;