BEGIN;

CREATE TABLE IF NOT EXISTS managed_toolkit_credentials (
    credential_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    toolkit_slug TEXT NOT NULL,
    auth_scheme TEXT NOT NULL,
    encrypted_payload TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_rotated_at TIMESTAMPTZ,

    CONSTRAINT managed_toolkit_credentials_unique UNIQUE (account_id, toolkit_slug, auth_scheme),
    CONSTRAINT managed_toolkit_credentials_toolkit_slug_not_empty CHECK (char_length(trim(toolkit_slug)) > 0),
    CONSTRAINT managed_toolkit_credentials_auth_scheme_not_empty CHECK (char_length(trim(auth_scheme)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_managed_toolkit_credentials_toolkit
    ON managed_toolkit_credentials(toolkit_slug, is_active);

CREATE INDEX IF NOT EXISTS idx_managed_toolkit_credentials_account
    ON managed_toolkit_credentials(account_id)
    WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_managed_toolkit_credentials_updated_at
    ON managed_toolkit_credentials(updated_at DESC);

ALTER TABLE managed_toolkit_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY managed_toolkit_credentials_select_policy
    ON managed_toolkit_credentials
    FOR SELECT
    USING (
        account_id IS NULL
        OR auth.uid() = account_id
    );

CREATE POLICY managed_toolkit_credentials_write_policy
    ON managed_toolkit_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY managed_toolkit_credentials_update_policy
    ON managed_toolkit_credentials
    FOR UPDATE
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY managed_toolkit_credentials_delete_policy
    ON managed_toolkit_credentials
    FOR DELETE
    USING (auth.uid() = account_id);

CREATE OR REPLACE FUNCTION set_managed_toolkit_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_managed_toolkit_credentials_updated_at
    ON managed_toolkit_credentials;

CREATE TRIGGER trigger_managed_toolkit_credentials_updated_at
    BEFORE UPDATE ON managed_toolkit_credentials
    FOR EACH ROW
    EXECUTE FUNCTION set_managed_toolkit_credentials_updated_at();

COMMIT;

