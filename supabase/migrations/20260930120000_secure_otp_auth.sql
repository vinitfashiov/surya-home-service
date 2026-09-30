-- Secure OTP auth before production launch.
-- Run in Supabase SQL Editor for project akxcyibzrmqvbojwbfqz.

-- 1. Brute-force protection: verify-otp counts wrong attempts per OTP
ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;

-- 2. The old policy had no role restriction, so anon/authenticated users could
--    read every OTP. Edge functions use the service role, which bypasses RLS,
--    so no policy is needed at all.
DROP POLICY IF EXISTS "Service role full access" ON public.otp_verifications;
REVOKE ALL ON public.otp_verifications FROM anon, authenticated;

-- 3. The old client-side login set predictable passwords (SuryaPass_<phone>!,
--    TestUserSecret987789!) on phone accounts. OTP login never uses passwords,
--    so replace them with random ones to close that backdoor.
UPDATE auth.users
SET encrypted_password = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'))
WHERE email ~ '^(user_|tester_|test_)?[0-9]{10}@(suryahomeservice\.in|phone\.surya\.app)$';

-- 4. Remove leftover test OTP rows
DELETE FROM public.otp_verifications WHERE otp IN ('123456', '987789');
