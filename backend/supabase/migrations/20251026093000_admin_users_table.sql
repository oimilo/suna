-- Admin users table mirroring Prophet production setup

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'support', 'admin', 'super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM admin_users
        WHERE user_id = check_user_id
        AND is_active = true
    ) INTO admin_exists;

    RETURN admin_exists;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM admin_users
    WHERE user_id = check_user_id
    AND is_active = true;

    RETURN user_role;
END;
$function$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_users'
          AND policyname = 'Admin users are viewable by admins'
    ) THEN
        CREATE POLICY "Admin users are viewable by admins" ON admin_users
            FOR SELECT USING (is_admin(auth.uid()));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_users'
          AND policyname = 'Super admins can manage admin users'
    ) THEN
        CREATE POLICY "Super admins can manage admin users" ON admin_users
            FOR ALL USING (get_admin_role(auth.uid()) = 'super_admin');
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
