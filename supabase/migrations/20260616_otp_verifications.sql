-- OTP Verifications Table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS otp_phone_idx ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS otp_expires_idx ON public.otp_verifications(expires_at);

-- RLS: Only service role can access (edge functions use service role)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions)
CREATE POLICY "Service role full access" ON public.otp_verifications
  FOR ALL USING (true);

-- Auto-cleanup: function to delete expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < now() - interval '1 hour';
END;
$$;
