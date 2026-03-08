
-- Fix bookings: drop restrictive admin policy and recreate as permissive
DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;
CREATE POLICY "Admins manage all bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix customers read own bookings: make permissive
DROP POLICY IF EXISTS "Customers read own bookings" ON public.bookings;
CREATE POLICY "Customers read own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

-- Fix customers create bookings
DROP POLICY IF EXISTS "Customers create bookings" ON public.bookings;
CREATE POLICY "Customers create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Fix customers update own bookings
DROP POLICY IF EXISTS "Customers update own bookings" ON public.bookings;
CREATE POLICY "Customers update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id);

-- Fix providers read own bookings
DROP POLICY IF EXISTS "Providers read own bookings" ON public.bookings;
CREATE POLICY "Providers read own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM providers
    WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()
  ));

-- Fix providers update own bookings
DROP POLICY IF EXISTS "Providers update own bookings" ON public.bookings;
CREATE POLICY "Providers update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM providers
    WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()
  ));

-- Fix servicemen read assigned bookings
DROP POLICY IF EXISTS "Servicemen read assigned bookings" ON public.bookings;
CREATE POLICY "Servicemen read assigned bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM servicemen
    WHERE servicemen.id = bookings.serviceman_id AND servicemen.user_id = auth.uid()
  ));

-- Fix servicemen update assigned bookings
DROP POLICY IF EXISTS "Servicemen update assigned bookings" ON public.bookings;
CREATE POLICY "Servicemen update assigned bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM servicemen
    WHERE servicemen.id = bookings.serviceman_id AND servicemen.user_id = auth.uid()
  ));
