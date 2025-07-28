-- SIMPLE ACCOUNT FIX
-- Execute estas queries uma por uma manualmente

-- 1. Deletar dados (execute apenas as tabelas que existem)
DELETE FROM agent_runs;
DELETE FROM threads;
DELETE FROM agents;
DELETE FROM projects;

-- 2. Deletar relacionamentos de conta
DELETE FROM basejump.account_user;

-- 3. Deletar todas as contas
DELETE FROM basejump.accounts;

-- 4. Corrigir a função que cria contas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    generated_user_name text;
BEGIN
    IF new.email IS NOT NULL THEN
        generated_user_name := split_part(new.email, '@', 1);
    END IF;
    
    -- IMPORTANTE: id = user_id
    INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account)
    VALUES (NEW.id, COALESCE(generated_user_name, 'User'), NEW.id, true);

    INSERT INTO basejump.account_user (account_id, user_id, account_role)
    VALUES (NEW.id, NEW.id, 'owner');

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE PROCEDURE basejump.run_new_user_setup();

-- 5. Criar conta para admin@oimilo.com (substitua o ID pelo seu user_id real)
INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account)
VALUES ('0fabc038-dab7-44d7-a3f3-fe0463180596', 'admin', '0fabc038-dab7-44d7-a3f3-fe0463180596', true);

INSERT INTO basejump.account_user (account_id, user_id, account_role)
VALUES ('0fabc038-dab7-44d7-a3f3-fe0463180596', '0fabc038-dab7-44d7-a3f3-fe0463180596', 'owner');

-- 6. Verificar se funcionou
SELECT 
    u.email,
    u.id as user_id,
    a.id as account_id,
    CASE WHEN u.id = a.id THEN '✓ CORRETO' ELSE '✗ ERRO' END as status
FROM auth.users u
LEFT JOIN basejump.account_user au ON au.user_id = u.id
LEFT JOIN basejump.accounts a ON a.id = au.account_id
WHERE u.email = 'admin@oimilo.com';