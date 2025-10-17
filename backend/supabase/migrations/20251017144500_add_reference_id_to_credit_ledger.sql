-- Add missing columns to credit_ledger to align with billing code
-- Idempotent and safe to run multiple times

BEGIN;

ALTER TABLE IF EXISTS public.credit_ledger
  ADD COLUMN IF NOT EXISTS reference_id uuid,
  ADD COLUMN IF NOT EXISTS reference_type text;

-- Helpful index for lookups by references
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference
  ON public.credit_ledger(reference_id, reference_type);

COMMIT;


