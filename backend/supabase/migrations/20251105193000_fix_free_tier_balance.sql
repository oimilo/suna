BEGIN;

-- Garantir consistência ao conceder créditos iniciais no cadastro
CREATE OR REPLACE FUNCTION public.initialize_free_tier_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_initial_credits NUMERIC := 5.0;
BEGIN
    IF NEW.personal_account = TRUE THEN
        INSERT INTO public.credit_accounts (
            account_id,
            balance,
            expiring_credits,
            non_expiring_credits,
            tier,
            trial_status,
            last_grant_date,
            lifetime_granted
        ) VALUES (
            NEW.id,
            v_initial_credits,
            0,
            v_initial_credits,
            'free',
            'none',
            NOW(),
            v_initial_credits
        )
        ON CONFLICT (account_id) DO NOTHING;

        INSERT INTO public.credit_ledger (
            account_id,
            amount,
            balance_after,
            type,
            description,
            is_expiring,
            metadata
        )
        SELECT
            NEW.id,
            v_initial_credits,
            v_initial_credits,
            'tier_grant',
            'Welcome to Prophet! Free tier initial credits',
            FALSE,
            jsonb_build_object('source', 'initialize_free_tier_credits')
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.credit_ledger
            WHERE account_id = NEW.id
              AND type = 'tier_grant'
              AND (
                  description ILIKE 'Welcome to Suna!%'
                  OR description ILIKE 'Welcome to Prophet!%'
              )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Corrigir contas existentes com saldos inconsistentes
DO $$
DECLARE
    acc RECORD;
BEGIN
    FOR acc IN
        SELECT account_id, balance
        FROM public.credit_accounts
        WHERE ABS(balance - (COALESCE(expiring_credits, 0) + COALESCE(non_expiring_credits, 0))) >= 0.01
    LOOP
        UPDATE public.credit_accounts
        SET
            expiring_credits = 0,
            non_expiring_credits = balance,
            lifetime_granted = GREATEST(COALESCE(lifetime_granted, 0), balance),
            updated_at = NOW()
        WHERE account_id = acc.account_id;

        INSERT INTO public.credit_ledger (
            account_id,
            amount,
            balance_after,
            type,
            description,
            is_expiring,
            metadata
        )
        SELECT
            acc.account_id,
            acc.balance,
            acc.balance,
            'tier_grant',
            'Welcome to Prophet! Free tier initial credits',
            FALSE,
            jsonb_build_object('source', 'initialize_free_tier_credits_backfill')
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.credit_ledger
            WHERE account_id = acc.account_id
              AND type = 'tier_grant'
              AND (
                  description ILIKE 'Welcome to Suna!%'
                  OR description ILIKE 'Welcome to Prophet!%'
              )
        );
    END LOOP;
END;
$$;

COMMIT;

