BEGIN;

-- Atualiza branding dos créditos iniciais para Prophet
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
              AND description ILIKE 'Welcome to Prophet!%'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Atualiza descrições já existentes
UPDATE public.credit_ledger
SET description = REPLACE(description, 'Suna', 'Prophet')
WHERE type = 'tier_grant'
  AND description ILIKE 'Welcome to Suna!%';

COMMIT;

