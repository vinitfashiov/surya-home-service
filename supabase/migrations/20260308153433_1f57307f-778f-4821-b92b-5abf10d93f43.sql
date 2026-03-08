
-- Fix the overly permissive notification insert policy
DROP POLICY "System inserts notifications" ON public.notifications;
-- Only authenticated users or admins can insert notifications
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
