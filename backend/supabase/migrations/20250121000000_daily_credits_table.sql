-- Create daily_credits table for tracking free daily credits for users
CREATE TABLE IF NOT EXISTS public.daily_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_granted DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
    credits_used DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure we don't have overlapping active credits for the same user
    CONSTRAINT unique_active_credits EXCLUDE USING gist (
        user_id WITH =,
        tstzrange(granted_at, expires_at, '[)') WITH &&
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_credits_user_id ON public.daily_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_credits_expires_at ON public.daily_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_credits_user_expires ON public.daily_credits(user_id, expires_at DESC);

-- Enable RLS
ALTER TABLE public.daily_credits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own daily credits
CREATE POLICY "Users can view own daily credits" ON public.daily_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all daily credits
CREATE POLICY "Service role can manage daily credits" ON public.daily_credits
    FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired credits (optional, for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_daily_credits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.daily_credits
    WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.daily_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_daily_credits() TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.daily_credits IS 'Tracks daily free credits for users. Credits expire after 24 hours and are automatically renewed.';
COMMENT ON COLUMN public.daily_credits.credits_granted IS 'Amount of credits granted for this period (default 200 = $2 worth)';
COMMENT ON COLUMN public.daily_credits.credits_used IS 'Amount of credits already used in this period';
COMMENT ON COLUMN public.daily_credits.expires_at IS 'When these daily credits expire (typically 24 hours after granted_at)';