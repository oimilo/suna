-- Create function to install Prophet agent for new users
CREATE OR REPLACE FUNCTION install_prophet_agent_for_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    agent_id UUID;
    version_id UUID;
BEGIN
    -- Generate new UUIDs
    agent_id := gen_random_uuid();
    version_id := gen_random_uuid();
    
    -- Create the Prophet agent for this user
    INSERT INTO agents (
        agent_id,
        account_id,
        name,
        description,
        is_default,
        avatar,
        avatar_color,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        agent_id,
        user_id, -- For personal accounts, account_id = user_id
        'Prophet',
        'Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.',
        true,
        '🌞',
        '#F59E0B',
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
    
    -- Create initial version for the agent
    INSERT INTO agent_versions (
        version_id,
        agent_id,
        version_number,
        config,
        created_at
    ) VALUES (
        version_id,
        agent_id,
        1,
        jsonb_build_object(
            'configured_mcps', '[]'::jsonb,
            'custom_mcps', '[]'::jsonb,
            'agentpress_tools', jsonb_build_object(
                'sb_shell_tool', jsonb_build_object('enabled', true, 'description', 'Execute shell commands'),
                'sb_files_tool', jsonb_build_object('enabled', true, 'description', 'Read, write, and edit files'),
                'sb_browser_tool', jsonb_build_object('enabled', true, 'description', 'Browse websites and interact with web pages'),
                'sb_deploy_tool', jsonb_build_object('enabled', true, 'description', 'Deploy web applications'),
                'sb_expose_tool', jsonb_build_object('enabled', true, 'description', 'Expose local services to the internet'),
                'web_search_tool', jsonb_build_object('enabled', true, 'description', 'Search the web for information'),
                'sb_vision_tool', jsonb_build_object('enabled', true, 'description', 'Analyze and understand images'),
                'sb_image_edit_tool', jsonb_build_object('enabled', true, 'description', 'Edit and manipulate images'),
                'data_providers_tool', jsonb_build_object('enabled', true, 'description', 'Access structured data from various providers')
            )
        ),
        NOW()
    );
    
    -- Update agent to use this version
    UPDATE agents 
    SET current_version_id = version_id 
    WHERE agent_id = agent_id;
    
END;
$$;

-- Modify the existing user setup function to include Prophet agent creation
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
    PERFORM install_prophet_agent_for_user(new.id);

    RETURN new;
END;
$$;

-- Install Prophet agent for all existing users who don't have it
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users who don't have the Prophet agent
    FOR user_record IN 
        SELECT DISTINCT au.id as user_id 
        FROM auth.users au
        WHERE NOT EXISTS (
            SELECT 1 
            FROM agents a 
            WHERE a.account_id = au.id 
            AND a.metadata->>'is_suna_default' = 'true'
        )
    LOOP
        -- Install Prophet agent for this user
        PERFORM install_prophet_agent_for_user(user_record.user_id);
    END LOOP;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION install_prophet_agent_for_user(UUID) TO service_role;