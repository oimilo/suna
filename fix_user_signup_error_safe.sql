-- Fix seguro para o erro "Database error saving new user"
-- Usa a abordagem original com IDs gerados automaticamente

-- 1. Backup da função atual (para referência)
-- SELECT pg_get_functiondef('basejump.run_new_user_setup'::regproc);

-- 2. Recriar a função usando a versão original mais segura
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    first_account_id uuid;
    generated_user_name text;
    account_exists boolean;
BEGIN
    -- Verificar se já existe uma conta pessoal para este usuário
    SELECT EXISTS(
        SELECT 1 FROM basejump.accounts 
        WHERE primary_owner_user_id = NEW.id 
        AND personal_account = true
    ) INTO account_exists;
    
    IF account_exists THEN
        RAISE NOTICE 'Conta pessoal já existe para o usuário %', NEW.email;
        RETURN NEW;
    END IF;
    
    -- Generate username from email
    IF NEW.email IS NOT NULL THEN
        generated_user_name := split_part(NEW.email, '@', 1);
    END IF;

    BEGIN
        -- Create a new account with auto-generated ID
        INSERT INTO basejump.accounts (name, primary_owner_user_id, personal_account)
        VALUES (COALESCE(generated_user_name, 'User'), NEW.id, true)
        RETURNING id INTO first_account_id;

        -- Add user to the account_user table as owner
        INSERT INTO basejump.account_user (account_id, user_id, account_role)
        VALUES (first_account_id, NEW.id, 'owner');

        RAISE NOTICE 'Conta pessoal criada com ID % para usuário %', first_account_id, NEW.email;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE WARNING 'Violação de unicidade ao criar conta para usuário %: %', NEW.email, SQLERRM;
            -- Tentar encontrar a conta existente
            SELECT id INTO first_account_id
            FROM basejump.accounts
            WHERE primary_owner_user_id = NEW.id 
            AND personal_account = true
            LIMIT 1;
            
            IF first_account_id IS NOT NULL THEN
                -- Verificar se o usuário já está na account_user
                IF NOT EXISTS (
                    SELECT 1 FROM basejump.account_user 
                    WHERE account_id = first_account_id 
                    AND user_id = NEW.id
                ) THEN
                    INSERT INTO basejump.account_user (account_id, user_id, account_role)
                    VALUES (first_account_id, NEW.id, 'owner');
                END IF;
            END IF;
            
        WHEN OTHERS THEN
            RAISE WARNING 'Erro ao criar conta para usuário %: %', NEW.email, SQLERRM;
            -- Re-lançar apenas se for um erro crítico
            IF SQLSTATE NOT IN ('23505', '23503') THEN  -- unique_violation, foreign_key_violation
                RAISE;
            END IF;
    END;

    RETURN NEW;
END;
$$;

-- 3. Verificar usuários sem conta pessoal
SELECT 
    u.id,
    u.email,
    u.created_at,
    a.id as account_id
FROM auth.users u
LEFT JOIN basejump.accounts a ON a.primary_owner_user_id = u.id AND a.personal_account = true
WHERE a.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Criar contas para usuários existentes sem conta (se houver)
DO $$
DECLARE
    user_record RECORD;
    new_account_id uuid;
    user_name text;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.email 
        FROM auth.users u
        LEFT JOIN basejump.accounts a ON a.primary_owner_user_id = u.id AND a.personal_account = true
        WHERE a.id IS NULL
    LOOP
        -- Generate username from email
        IF user_record.email IS NOT NULL THEN
            user_name := split_part(user_record.email, '@', 1);
        ELSE
            user_name := 'User';
        END IF;
        
        -- Create account
        INSERT INTO basejump.accounts (name, primary_owner_user_id, personal_account)
        VALUES (user_name, user_record.id, true)
        RETURNING id INTO new_account_id;
        
        -- Add to account_user
        INSERT INTO basejump.account_user (account_id, user_id, account_role)
        VALUES (new_account_id, user_record.id, 'owner');
        
        RAISE NOTICE 'Conta criada retroativamente para usuário %', user_record.email;
    END LOOP;
END $$;

-- 5. Verificar o resultado
SELECT 
    'Total de usuários:' as info,
    COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
    'Total de contas pessoais:' as info,
    COUNT(*) as total
FROM basejump.accounts
WHERE personal_account = true
UNION ALL
SELECT 
    'Usuários sem conta pessoal:' as info,
    COUNT(*) as total
FROM auth.users u
LEFT JOIN basejump.accounts a ON a.primary_owner_user_id = u.id AND a.personal_account = true
WHERE a.id IS NULL;

RAISE NOTICE 'Correção aplicada com sucesso!';