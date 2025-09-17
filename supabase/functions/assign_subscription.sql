-- Function to manually assign a subscription to a user
-- This creates a fake subscription record that makes the system think the user has a paid plan

CREATE OR REPLACE FUNCTION assign_manual_subscription(
    p_user_id UUID,
    p_price_id TEXT,
    p_months INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id TEXT;
    v_result JSON;
BEGIN
    -- Get or create customer ID
    SELECT id INTO v_customer_id 
    FROM basejump.billing_customers 
    WHERE account_id = p_user_id::TEXT;
    
    -- If no customer exists, create one
    IF v_customer_id IS NULL THEN
        v_customer_id := 'cus_manual_' || substr(md5(random()::text), 1, 14);
        
        INSERT INTO basejump.billing_customers (
            id,
            account_id,
            email,
            provider,
            active
        )
        SELECT 
            v_customer_id,
            p_user_id::TEXT,
            email,
            'stripe',
            true
        FROM auth.users
        WHERE id = p_user_id;
    ELSE
        -- Update existing customer to active
        UPDATE basejump.billing_customers 
        SET active = true 
        WHERE id = v_customer_id;
    END IF;
    
    -- Create subscription record
    INSERT INTO basejump.billing_subscriptions (
        id,
        customer_id,
        status,
        price_id,
        quantity,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        metadata
    ) VALUES (
        'sub_manual_' || substr(md5(random()::text), 1, 20),
        v_customer_id,
        'active',
        p_price_id,
        1,
        NOW(),
        NOW() + (p_months || ' months')::INTERVAL,
        false,
        jsonb_build_object(
            'manual_assignment', true,
            'assigned_by', auth.uid(),
            'assigned_at', NOW()
        )
    )
    ON CONFLICT (customer_id) 
    DO UPDATE SET 
        status = 'active',
        price_id = EXCLUDED.price_id,
        current_period_end = EXCLUDED.current_period_end,
        metadata = EXCLUDED.metadata;
    
    v_result := json_build_object(
        'success', true,
        'customer_id', v_customer_id,
        'message', 'Subscription assigned successfully'
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated users (or restrict to admins)
GRANT EXECUTE ON FUNCTION assign_manual_subscription TO authenticated;

-- Example usage:
-- SELECT assign_manual_subscription(
--     'user-uuid-here',
--     'price_1RqK0hFNfWjTbEjsaAFuY7Cb', -- Pro plan
--     3 -- 3 months
-- );