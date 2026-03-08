

## Plan: Fix Security Warnings

### 1. Restrict Notifications INSERT RLS Policy

The current policy allows **any authenticated user** to insert notifications for **any other user** (`WITH CHECK (true)`). This is a privilege escalation risk — a malicious user could spam notifications to other users.

**Fix:** Replace the permissive INSERT policy with one that only allows users to insert notifications **for themselves** (matching `auth.uid() = user_id`). Admin notifications to other users are already covered by the existing "Admins manage notifications" ALL policy.

```sql
-- Drop the overly permissive policy
DROP POLICY "Authenticated insert notifications" ON public.notifications;

-- Create restricted policy: users can only create notifications for themselves
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### 2. Enable Leaked Password Protection

Supabase Auth supports HaveIBeenPwned integration to reject compromised passwords. This requires a configuration change in `supabase/config.toml` under `[auth]`.

**Change in `supabase/config.toml`:**
- Add or update the password security settings to enable leaked password detection.

> Note: For the external Supabase project, leaked password protection may need to be enabled via the Supabase Dashboard under **Authentication > Providers > Email** settings. I'll update the config.toml and also inform you where to toggle it in the dashboard.

### 3. Update Code That Creates Notifications for Other Users

The `BookingPage.tsx` creates a notification for the logged-in user (self), which will still work. However, any future code that creates notifications for *other* users (e.g., notifying providers) will need to go through an Edge Function or admin-level operation. I'll audit the codebase for such cases and flag them.

---

**Summary of changes:**
- 1 SQL migration: drop + recreate the notifications INSERT policy
- 1 config update: `supabase/config.toml` for password protection
- Code audit for notification creation patterns (adjust if needed)

