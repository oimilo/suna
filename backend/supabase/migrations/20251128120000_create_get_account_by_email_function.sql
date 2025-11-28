-- Create function to get account_id by email from auth.users
-- This is needed for admin operations when user is not in billing_customers
-- (e.g., after Stripe customer cleanup)

CREATE OR REPLACE FUNCTION public.get_account_by_email(search_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_account_id UUID;
BEGIN
    -- First try to get from auth.users directly
    SELECT id INTO found_account_id
    FROM auth.users
    WHERE email = search_email
    LIMIT 1;
    
    RETURN found_account_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_account_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_account_by_email(TEXT) TO service_role;

