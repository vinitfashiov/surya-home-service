-- SQL Script to add additional fields for premium Urban Company-like provider options

ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS whatsapp_updates BOOLEAN DEFAULT TRUE;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS app_language TEXT DEFAULT 'hinglish';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS credits NUMERIC DEFAULT 500;

-- Comments for documentation
COMMENT ON COLUMN public.providers.aadhaar_number IS 'Aadhaar Number of the provider (encrypted or stored as text)';
COMMENT ON COLUMN public.providers.aadhaar_verified IS 'True if Aadhaar is verified by the platform';
COMMENT ON COLUMN public.providers.gst_number IS 'GSTIN of the provider company';
COMMENT ON COLUMN public.providers.pan_number IS 'PAN code of the provider';
COMMENT ON COLUMN public.providers.bank_account_number IS 'Bank account number of the provider for payouts';
COMMENT ON COLUMN public.providers.bank_name IS 'Name of the payout bank';
COMMENT ON COLUMN public.providers.bank_ifsc IS 'IFSC code of the payout bank branch';
COMMENT ON COLUMN public.providers.bank_account_name IS 'Registered name in the bank account';
COMMENT ON COLUMN public.providers.credits IS 'Current wallet credit balance for bookings';
