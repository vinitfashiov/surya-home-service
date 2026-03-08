-- Drop the overly permissive INSERT policy
DROP POLICY "Authenticated insert notifications" ON public.notifications;

-- Create restricted policy: users can only create notifications for themselves
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);