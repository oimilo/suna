-- Fix para o erro "Database error saving new user"
-- O problema está no trigger que cria contas para novos usuários

-- 1. Primeiro, vamos verificar se há conflitos de ID
SELECT 
    'Contas existentes:' as info,
    COUNT(*) as total_contas
FROM basejump.accounts;

SELECT 
    'Usuários existentes:' as info,
    COUNT(*) as total_usuarios
FROM auth.users;

-- 2. Verificar se há contas com ID igual ao user_id que podem estar causando conflito
SELECT 
    a.id as account_id,
    a.name as account_name,
    a.primary_owner_user_id,
    u.email as user_email,
    a.personal_account,
    a.created_at
FROM basejump.accounts a
JOIN auth.users u ON u.id = a.primary_owner_user_id
WHERE a.id = a.primary_owner_user_id
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Recriar a função do trigger com tratamento de erro melhor
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    generated_user_name text;
    account_exists boolean;
BEGIN
    -- Verificar se já existe uma conta para este usuário
    SELECT EXISTS(
        SELECT 1 FROM basejump.accounts 
        WHERE id = NEW.id OR primary_owner_user_id = NEW.id
    ) INTO account_exists;
    
    IF account_exists THEN
        RAISE NOTICE 'Conta já existe para o usuário % com id %', NEW.email, NEW.id;
        RETURN NEW;
    END IF;
    
    -- Get username from email
    IF new.email IS NOT NULL THEN
        generated_user_name := split_part(new.email, '@', 1);
    END IF;
    
    BEGIN
        -- Create account with id = user_id
        INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account)
        VALUES (NEW.id, COALESCE(generated_user_name, 'User'), NEW.id, true);

        -- Add user as owner of their account
        INSERT INTO basejump.account_user (account_id, user_id, account_role)
        VALUES (NEW.id, NEW.id, 'owner');

        RAISE NOTICE 'Conta criada para usuário % com id %', NEW.email, NEW.id;
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'Violação de unicidade ao criar conta para usuário %: %', NEW.email, SQLERRM;
            -- Não falhar a transação, apenas logar o erro
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'Violação de chave estrangeira ao criar conta para usuário %: %', NEW.email, SQLERRM;
            -- Não falhar a transação, apenas logar o erro
        WHEN OTHERS THEN
            RAISE WARNING 'Erro ao criar conta para usuário %: %', NEW.email, SQLERRM;
            -- Re-lançar o erro para que possamos ver o que está acontecendo
            RAISE;
    END;
    
    RETURN NEW;
END;
$$;

-- 4. Verificar se o trigger existe e está ativo
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    tgtype as trigger_type
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 5. Se necessário, recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE PROCEDURE basejump.run_new_user_setup();

-- 6. Testar a função manualmente (comentado por segurança)
-- SELECT basejump.run_new_user_setup() FROM auth.users WHERE email = 'test@example.com' LIMIT 1;

RAISE NOTICE 'Função e trigger atualizados com tratamento de erro melhorado';