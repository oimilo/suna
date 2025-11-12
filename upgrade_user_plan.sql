-- ======================================================================
-- Manual plan upgrade helper
-- ----------------------------------------------------------------------
-- Objetivo: promover um usuário para um plano pago (tier) e conceder os
-- créditos correspondentes em uma única execução SQL.
--
-- Como usar:
--   1. Atualize os valores da CTE `config` abaixo (account_id, tier, etc.).
--   2. Rode o script no Supabase SQL Editor (ou psql) usando a role service.
--   3. O script cria/atualiza a linha em `credit_accounts` e registra o
--      movimento em `credit_ledger`.
--
-- Campos que você pode ajustar:
--   * account_id            -> UUID do usuário/conta (obrigatório)
--   * target_tier           -> Nome do tier (ex: 'tier_6_50')
--   * credits_to_grant      -> Quantidade de créditos a conceder
--   * ledger_description    -> Texto que aparecerá no histórico
--   * grant_interval_days   -> Em quantos dias o próximo grant recorrente deverá acontecer
-- ======================================================================

WITH config AS (
    SELECT
        -- TODO: Substitua pelos valores desejados antes de executar
        '00000000-0000-0000-0000-000000000000'::uuid AS account_id,
        'tier_6_50'::text                       AS target_tier,
        50::numeric                             AS credits_to_grant,
        'Manual upgrade to tier_6_50 (Pro)'::text AS ledger_description,
        30::integer                             AS grant_interval_days
),
-- Garante que exista uma linha em credit_accounts para o usuário alvo.
ensure_account AS (
    INSERT INTO public.credit_accounts (
        account_id,
        balance,
        lifetime_granted,
        lifetime_purchased,
        lifetime_used,
        expiring_credits,
        non_expiring_credits,
        tier,
        created_at,
        updated_at,
        last_grant_date,
        next_credit_grant
    )
    SELECT
        account_id,
        0,
        0,
        0,
        0,
        0,
        0,
        'free',
        NOW(),
        NOW(),
        NOW(),
        NOW()
    FROM config
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.credit_accounts ca
        WHERE ca.account_id = config.account_id
    )
),
-- Atualiza o registro com o novo tier e créditos.
updated_account AS (
    UPDATE public.credit_accounts ca
    SET
        tier              = config.target_tier,
        balance           = ca.balance + config.credits_to_grant,
        expiring_credits  = COALESCE(ca.expiring_credits, 0) + config.credits_to_grant,
        lifetime_granted  = COALESCE(ca.lifetime_granted, 0) + config.credits_to_grant,
        last_grant_date   = NOW(),
        next_credit_grant = NOW() + (config.grant_interval_days || ' days')::interval,
        updated_at        = NOW()
    FROM config
    WHERE ca.account_id = config.account_id
    RETURNING
        ca.account_id,
        ca.balance             AS new_balance,
        config.credits_to_grant,
        config.ledger_description,
        config.target_tier
),
-- Registra o movimento no histórico de créditos.
ledger_entry AS (
    INSERT INTO public.credit_ledger (
        id,
        account_id,
        amount,
        balance_after,
        type,
        description,
        is_expiring,
        created_at
    )
    SELECT
        gen_random_uuid(),
        ua.account_id,
        ua.credits_to_grant,
        ua.new_balance,
        'tier_grant',
        ua.ledger_description,
        TRUE,
        NOW()
    FROM updated_account ua
    RETURNING account_id
)
-- Resultado final para conferência rápida.
SELECT
    '✅ Plano atualizado para ' || ua.target_tier || ' – créditos concedidos: ' || ua.credits_to_grant AS message,
    'Novo saldo: ' || ua.new_balance AS new_balance
FROM updated_account ua;

