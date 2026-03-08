
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Customers can read/write messages on their own bookings
CREATE POLICY "Customers manage own booking messages"
ON public.chat_messages FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = chat_messages.booking_id
    AND bookings.customer_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = chat_messages.booking_id
    AND bookings.customer_id = auth.uid()
  )
);

-- Providers can read/write messages on their own bookings
CREATE POLICY "Providers manage own booking messages"
ON public.chat_messages FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.providers p ON p.id = b.provider_id
    WHERE b.id = chat_messages.booking_id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.providers p ON p.id = b.provider_id
    WHERE b.id = chat_messages.booking_id
    AND p.user_id = auth.uid()
  )
);

-- Admins manage all
CREATE POLICY "Admins manage all chat messages"
ON public.chat_messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
