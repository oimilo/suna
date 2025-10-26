ALTER TABLE credit_accounts
    ADD COLUMN IF NOT EXISTS lifetime_granted NUMERIC(12, 4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lifetime_purchased NUMERIC(12, 4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lifetime_used NUMERIC(12, 4) NOT NULL DEFAULT 0;

COMMENT ON COLUMN credit_accounts.lifetime_granted IS 'Total credits granted (tier/admin) over account lifetime.';
COMMENT ON COLUMN credit_accounts.lifetime_purchased IS 'Total credits purchased over account lifetime.';
COMMENT ON COLUMN credit_accounts.lifetime_used IS 'Total credits consumed over account lifetime.';
