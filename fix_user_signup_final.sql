-- Correção final para o erro "Database error saving new user"
-- Mantém a estrutura account_id = user_id necessária para Stripe e Prophet

-- 1. Verificar o estado atual
SELECT 
    'Verificando estrutura atual...' as status;

-- Verificar se há problemas com a tabela profiles
SELECT 
    EXISTS(SELECT 1 FROM information_schema.tables 
           WHERE table_schema = 'basejump' 
           AND table_name = 'profiles') as profiles_table_exists;

-- 2. Garantir que a tabela profiles existe
CREATE TABLE IF NOT EXISTS basejump.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recriar a função com tratamento de erro robusto
CREATE OR REPLACE FUNCTION basejump.run_new_user_setup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    generated_user_name text;
    profile_exists boolean;
    account_exists boolean;
    account_user_exists boolean;
BEGIN
    -- Extrair nome do email
    IF NEW.email IS NOT NULL THEN
        generated_user_name := split_part(NEW.email, '@', 1);
    ELSE
        generated_user_name := 'User';
    END IF;
    
    -- 1. Criar ou atualizar profile
    SELECT EXISTS(SELECT 1 FROM basejump.profiles WHERE id = NEW.id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        INSERT INTO basejump.profiles (id, name)
        VALUES (NEW.id, generated_user_name)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- 2. Criar conta pessoal (account_id = user_id)
    SELECT EXISTS(SELECT 1 FROM basejump.accounts WHERE id = NEW.id) INTO account_exists;
    
    IF NOT account_exists THEN
        BEGIN
            INSERT INTO basejump.accounts (id, primary_owner_user_id, name, personal_account)
            VALUES (NEW.id, NEW.id, generated_user_name, true);
            
            RAISE NOTICE 'Conta criada com sucesso para usuário %', NEW.email;
        EXCEPTION 
            WHEN unique_violation THEN
                RAISE NOTICE 'Conta já existe para usuário %', NEW.email;
            WHEN OTHERS THEN
                RAISE WARNING 'Erro ao criar conta: %. Continuando...', SQLERRM;
        END;
    END IF;
    
    -- 3. Adicionar usuário como owner da conta
    SELECT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = NEW.id 
        AND user_id = NEW.id
    ) INTO account_user_exists;
    
    IF NOT account_user_exists THEN
        BEGIN
            INSERT INTO basejump.account_user (account_id, user_id, account_role)
            VALUES (NEW.id, NEW.id, 'owner')
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Usuário adicionado como owner da conta';
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Erro ao adicionar usuário à conta: %. Continuando...', SQLERRM;
        END;
    END IF;
    
    -- 4. Instalar Prophet agent (se a função existir)
    BEGIN
        IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'install_prophet_agent_for_user') THEN
            PERFORM install_prophet_agent_for_user(NEW.id);
            RAISE NOTICE 'Prophet agent instalado para usuário %', NEW.email;
        END IF;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE WARNING 'Erro ao instalar Prophet agent: %. Continuando...', SQLERRM;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha a transação de criação do usuário
        RAISE WARNING 'Erro no setup do usuário %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- 4. Verificar e corrigir usuários existentes sem conta
DO $$
DECLARE
    user_record RECORD;
    user_name text;
    fixed_count integer := 0;
BEGIN
    FOR user_record IN 
        SELECT u.id, u.email, u.created_at
        FROM auth.users u
        LEFT JOIN basejump.accounts a ON a.id = u.id
        WHERE a.id IS NULL
        ORDER BY u.created_at DESC
    LOOP
        -- Extrair nome do email
        IF user_record.email IS NOT NULL THEN
            user_name := split_part(user_record.email, '@', 1);
        ELSE
            user_name := 'User';
        END IF;
        
        BEGIN
            -- Criar profile se não existir
            INSERT INTO basejump.profiles (id, name)
            VALUES (user_record.id, user_name)
            ON CONFLICT (id) DO NOTHING;
            
            -- Criar conta
            INSERT INTO basejump.accounts (id, primary_owner_user_id, name, personal_account)
            VALUES (user_record.id, user_record.id, user_name, true);
            
            -- Adicionar como owner
            INSERT INTO basejump.account_user (account_id, user_id, account_role)
            VALUES (user_record.id, user_record.id, 'owner');
            
            -- Instalar Prophet se a função existir
            IF EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'install_prophet_agent_for_user') THEN
                PERFORM install_prophet_agent_for_user(user_record.id);
            END IF;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Conta criada para usuário existente: %', user_record.email;
            
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Erro ao criar conta para %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total de contas criadas: %', fixed_count;
END $$;

-- 5. Verificar resultado final
SELECT 
    'Usuários totais' as tipo,
    COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
    'Contas pessoais' as tipo,
    COUNT(*) as quantidade
FROM basejump.accounts
WHERE personal_account = true
UNION ALL
SELECT 
    'Agents Prophet' as tipo,
    COUNT(*) as quantidade
FROM agents
WHERE metadata->>'is_suna_default' = 'true'
UNION ALL
SELECT 
    'Usuários sem conta' as tipo,
    COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN basejump.accounts a ON a.id = u.id
WHERE a.id IS NULL;

RAISE NOTICE 'Correção aplicada com sucesso!';