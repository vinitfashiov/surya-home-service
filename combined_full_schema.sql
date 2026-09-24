-- COMBINED SUPABASE SCHEMA AND SEED DATA MIGRATION


-- ==========================================================
-- Migration File: 20260308143052_52a0d616-3a62-4386-a561-2d8ed2f3915b.sql
-- ==========================================================


-- 1. Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'employee', 'customer', 'provider', 'serviceman');
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'assigned', 'on_the_way', 'started', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User roles table (separate from profiles per security rules)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Service categories
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'Wrench',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- 6. Providers
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  rating NUMERIC(2,1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 7. Servicemen
CREATE TABLE public.servicemen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  rating NUMERIC(2,1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  completed_jobs INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.servicemen ENABLE ROW LEVEL SECURITY;

-- 8. Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 60,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 9. Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  serviceman_id UUID REFERENCES public.servicemen(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 10. Employees (admin staff)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  department TEXT DEFAULT 'general',
  permissions TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 11. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. RLS Policies

-- Profiles: users read own, admins read all
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User roles: users read own
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories: public read, admin write
CREATE POLICY "Anyone can read categories" ON public.service_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.service_categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Providers: public read, own write, admin all
CREATE POLICY "Anyone can read active providers" ON public.providers
  FOR SELECT USING (true);
CREATE POLICY "Providers update own" ON public.providers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage providers" ON public.providers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can insert provider" ON public.providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Servicemen: provider manages own, admin all, serviceman reads own
CREATE POLICY "Anyone can read servicemen" ON public.servicemen
  FOR SELECT USING (true);
CREATE POLICY "Providers manage own servicemen" ON public.servicemen
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins manage servicemen" ON public.servicemen
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services: public read, provider manages own
CREATE POLICY "Anyone can read active services" ON public.services
  FOR SELECT USING (true);
CREATE POLICY "Providers manage own services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins manage services" ON public.services
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Bookings: customer reads own, provider reads own, serviceman reads assigned, admin all
CREATE POLICY "Customers read own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Providers read own bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
  );
CREATE POLICY "Servicemen read assigned bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.servicemen WHERE id = serviceman_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins manage all bookings" ON public.bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Providers update own bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
  );
CREATE POLICY "Servicemen update assigned bookings" ON public.bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.servicemen WHERE id = serviceman_id AND user_id = auth.uid())
  );

-- Employees: admin only
CREATE POLICY "Admins manage employees" ON public.employees
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employees read own" ON public.employees
  FOR SELECT USING (auth.uid() = user_id);

-- 13. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ==========================================================
-- Migration File: 20260308143111_98e8f28e-ef13-4b45-ba07-bc563955869c.sql
-- ==========================================================


CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ==========================================================
-- Migration File: 20260308151514_f1ed7ec2-8234-4e47-9fd8-401584317b89.sql
-- ==========================================================


CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage settings"
  ON public.platform_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('business_name', 'ServisGo'),
  ('business_email', 'contact@servisgo.com'),
  ('business_phone', ''),
  ('business_address', ''),
  ('working_hours_start', '09:00'),
  ('working_hours_end', '18:00'),
  ('working_days', 'Mon,Tue,Wed,Thu,Fri'),
  ('currency', 'USD'),
  ('booking_notice_hours', '24'),
  ('max_bookings_per_day', '50');


-- ==========================================================
-- Migration File: 20260308153412_1442b0ed-1322-421e-ad4f-50c074db3dc9.sql
-- ==========================================================


-- 1. Cities table
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins manage cities" ON public.cities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add city_id to providers and services
ALTER TABLE public.providers ADD COLUMN city_id uuid REFERENCES public.cities(id);
ALTER TABLE public.services ADD COLUMN city_id uuid REFERENCES public.cities(id);

-- 3. Customer addresses table
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  address_line text NOT NULL,
  city_id uuid REFERENCES public.cities(id),
  pincode text DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses" ON public.customer_addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins read all addresses" ON public.customer_addresses FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 5. Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid NOT NULL,
  serviceman_id uuid REFERENCES public.servicemen(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Add commission_rate to categories
ALTER TABLE public.service_categories ADD COLUMN commission_rate numeric NOT NULL DEFAULT 20;

-- 7. Add city_id to bookings for tracking
ALTER TABLE public.bookings ADD COLUMN city_id uuid REFERENCES public.cities(id);


-- ==========================================================
-- Migration File: 20260308153433_1f57307f-778f-4821-b92b-5abf10d93f43.sql
-- ==========================================================


-- Fix the overly permissive notification insert policy
DROP POLICY "System inserts notifications" ON public.notifications;
-- Only authenticated users or admins can insert notifications
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);


-- ==========================================================
-- Migration File: 20260308170503_ae6debd6-6538-4d2f-ab0c-17b5ddd7f9cb.sql
-- ==========================================================


-- Service add-ons table
CREATE TABLE public.service_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active addons" ON public.service_addons
  FOR SELECT USING (true);

CREATE POLICY "Providers manage own addons" ON public.service_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN providers p ON p.id = s.provider_id
      WHERE s.id = service_addons.service_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage addons" ON public.service_addons
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Cart items table (DB-backed cart)
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Cart addon selections
CREATE TABLE public.cart_item_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_item_id UUID REFERENCES public.cart_items(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES public.service_addons(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(cart_item_id, addon_id)
);

ALTER TABLE public.cart_item_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cart addons" ON public.cart_item_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cart_items ci WHERE ci.id = cart_item_addons.cart_item_id AND ci.user_id = auth.uid()
    )
  );


-- ==========================================================
-- Migration File: 20260308171422_f239d85e-e57c-495a-bfa8-ccfecf3c23e7.sql
-- ==========================================================


INSERT INTO platform_settings (key, value) VALUES 
  ('cancellation_free_minutes', '30'),
  ('cancellation_fee_percent', '10'),
  ('cancellation_enabled', 'true')
ON CONFLICT DO NOTHING;


-- ==========================================================
-- Migration File: 20260308172756_3a9bc410-ae25-48d1-b7d5-84b60730b5fb.sql
-- ==========================================================


-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_discount numeric DEFAULT NULL,
  usage_limit integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));


-- ==========================================================
-- Migration File: 20260308174435_7dc06795-bd4f-4ef6-b75f-0142207ce4c3.sql
-- ==========================================================


-- Add category_type to service_categories
ALTER TABLE public.service_categories 
ADD COLUMN IF NOT EXISTS category_type text NOT NULL DEFAULT 'standard';

-- Create category_checkout_fields table
CREATE TABLE public.category_checkout_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  placeholder text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create booking_custom_fields table
CREATE TABLE public.booking_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.category_checkout_fields(id) ON DELETE CASCADE,
  field_value text NOT NULL DEFAULT ''
);

-- RLS for category_checkout_fields
ALTER TABLE public.category_checkout_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read checkout fields"
ON public.category_checkout_fields FOR SELECT
USING (true);

CREATE POLICY "Admins manage checkout fields"
ON public.category_checkout_fields FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for booking_custom_fields
ALTER TABLE public.booking_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own booking fields"
ON public.booking_custom_fields FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_custom_fields.booking_id
    AND bookings.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all booking fields"
ON public.booking_custom_fields FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers read own booking fields"
ON public.booking_custom_fields FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.providers p ON p.id = b.provider_id
    WHERE b.id = booking_custom_fields.booking_id
    AND p.user_id = auth.uid()
  )
);


-- ==========================================================
-- Migration File: 20260308175141_d749a6c1-abb4-4108-8927-225fbeaf4780.sql
-- ==========================================================


-- Service subcategories
CREATE TABLE public.service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'Tag',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active subcategories"
ON public.service_subcategories FOR SELECT USING (true);

CREATE POLICY "Admins manage subcategories"
ON public.service_subcategories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add subcategory_id to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.service_subcategories(id) ON DELETE SET NULL;

-- Service variants
CREATE TABLE public.service_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active variants"
ON public.service_variants FOR SELECT USING (true);

CREATE POLICY "Admins manage variants"
ON public.service_variants FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers manage own variants"
ON public.service_variants FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.providers p ON p.id = s.provider_id
    WHERE s.id = service_variants.service_id AND p.user_id = auth.uid()
  )
);


-- ==========================================================
-- Migration File: 20260308175706_acaacf4f-a40f-4ddd-8e94-7759759c8d4a.sql
-- ==========================================================


-- Provider availability calendar
CREATE TABLE public.provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  start_time text NOT NULL DEFAULT '9:00 AM',
  end_time text NOT NULL DEFAULT '5:00 PM',
  max_bookings_per_slot integer NOT NULL DEFAULT 0,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, date)
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read provider availability"
ON public.provider_availability FOR SELECT USING (true);

CREATE POLICY "Providers manage own availability"
ON public.provider_availability FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.id = provider_availability.provider_id
    AND providers.user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all availability"
ON public.provider_availability FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));


-- ==========================================================
-- Migration File: 20260308184057_d3320f7f-392a-4bc1-a5ea-e4a8a80a5eba.sql
-- ==========================================================


-- Promotional banners table for admin-managed homepage banners
CREATE TABLE public.promotional_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage banners" ON public.promotional_banners FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active banners" ON public.promotional_banners FOR SELECT USING (true);


-- ==========================================================
-- Migration File: 20260308184639_428075dd-1a0b-4edd-817d-c1a5983163b8.sql
-- ==========================================================


-- Dynamic pricing rules table
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL DEFAULT 'flat',
  base_price NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit_label TEXT NOT NULL DEFAULT 'unit',
  min_units NUMERIC DEFAULT 0,
  max_units NUMERIC DEFAULT NULL,
  linked_field_name TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pricing rules" ON public.pricing_rules FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active pricing rules" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Providers manage own pricing rules" ON public.pricing_rules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id
    WHERE s.id = pricing_rules.service_id AND p.user_id = auth.uid()
  )
);


-- ==========================================================
-- Migration File: 20260308185109_e803bd9c-d820-454f-8177-db2180665e01.sql
-- ==========================================================


CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);


-- ==========================================================
-- Migration File: 20260308185419_828bb1a8-d1e3-4c37-806d-b89ecac454aa.sql
-- ==========================================================


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


-- ==========================================================
-- Migration File: 20260308193513_3c384ada-34bc-4a39-b65f-fdc86b05ecd0.sql
-- ==========================================================

INSERT INTO cities (id, name, state, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Mumbai', 'Maharashtra', true),
  ('a2222222-2222-2222-2222-222222222222', 'Delhi', 'Delhi', true),
  ('a3333333-3333-3333-3333-333333333333', 'Bangalore', 'Karnataka', true),
  ('a4444444-4444-4444-4444-444444444444', 'Hyderabad', 'Telangana', true),
  ('a5555555-5555-5555-5555-555555555555', 'Pune', 'Maharashtra', true),
  ('a6666666-6666-6666-6666-666666666666', 'Chennai', 'Tamil Nadu', true)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- Migration File: 20260308193547_12426c2e-7a83-43f1-aed3-d3b6932c1637.sql
-- ==========================================================

INSERT INTO service_categories (id, name, description, icon, is_active, commission_rate, category_type) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Home Cleaning', 'Professional home cleaning services', 'Sparkles', true, 20, 'standard'),
  ('b2222222-2222-2222-2222-222222222222', 'Plumbing', 'Expert plumbing repair and installation', 'Wrench', true, 15, 'standard'),
  ('b3333333-3333-3333-3333-333333333333', 'Electrical', 'Electrical repair and wiring services', 'Zap', true, 15, 'standard'),
  ('b4444444-4444-4444-4444-444444444444', 'AC & Appliance Repair', 'AC servicing and appliance repair', 'Fan', true, 18, 'standard'),
  ('b5555555-5555-5555-5555-555555555555', 'Salon at Home', 'Beauty and grooming at your doorstep', 'Scissors', true, 25, 'standard')
ON CONFLICT DO NOTHING;

-- Demo provider + services seed removed: depended on a fake auth.users id from the original Lovable project.
-- Create real providers via /admin panel after signup. Categories/coupons/banners below are still seeded.

INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'FIRST50', 'percentage', 50, 500, 200, 100, true)
ON CONFLICT DO NOTHING;

INSERT INTO promotional_banners (id, title, subtitle, is_active, display_order) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Get 50% Off Your First Booking!', 'Use code FIRST50 at checkout', true, 1)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- Migration File: 20260308194549_7016585a-7b87-4785-88d7-63b1f3f512fc.sql
-- ==========================================================

-- Demo providers/services/addons seed removed: depended on a fake auth.users id from the original Lovable project.
-- Create real providers and services via /admin panel after signup.

-- Add another banner
INSERT INTO promotional_banners (id, title, subtitle, is_active, display_order) VALUES
  ('f2222222-2222-2222-2222-222222222222', 'Professional Home Cleaning', 'Starting at just ₹599. Book now!', true, 2)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- Migration File: 20260308195657_9c8bfd87-d96c-4b51-bddf-1a74105732d4.sql
-- ==========================================================


-- Seed provider availability for next 14 days for both providers
INSERT INTO provider_availability (provider_id, date, is_available, start_time, end_time, max_bookings_per_slot, note)
SELECT 
  p.id,
  d::date,
  true,
  '9:00 AM',
  '5:00 PM',
  3,
  'Regular working day'
FROM providers p
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + interval '14 days', interval '1 day') d
WHERE p.id IN ('c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;


-- ==========================================================
-- Migration File: 20260308200515_f17f7967-2a72-4398-a003-06d49c7a97b8.sql
-- ==========================================================

-- Drop the overly permissive INSERT policy
DROP POLICY "Authenticated insert notifications" ON public.notifications;

-- Create restricted policy: users can only create notifications for themselves
CREATE POLICY "Users insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ==========================================================
-- Migration File: 20260308201601_a1f390c5-0e28-4081-9996-304fd732ae47.sql
-- ==========================================================


-- =====================================================
-- Phase 1.1: Convert ALL RLS policies to PERMISSIVE
-- =====================================================
-- PostgreSQL default is PERMISSIVE. All policies were created as RESTRICTIVE,
-- which means without any PERMISSIVE policy, RLS denies all access.
-- We must DROP and recreate each policy.

-- =====================================================
-- TABLE: booking_custom_fields
-- =====================================================
DROP POLICY "Admins manage all booking fields" ON public.booking_custom_fields;
CREATE POLICY "Admins manage all booking fields" ON public.booking_custom_fields FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Customers manage own booking fields" ON public.booking_custom_fields;
CREATE POLICY "Customers manage own booking fields" ON public.booking_custom_fields FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_custom_fields.booking_id AND bookings.customer_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_custom_fields.booking_id AND bookings.customer_id = auth.uid()));

DROP POLICY "Providers read own booking fields" ON public.booking_custom_fields;
CREATE POLICY "Providers read own booking fields" ON public.booking_custom_fields FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM bookings b JOIN providers p ON p.id = b.provider_id WHERE b.id = booking_custom_fields.booking_id AND p.user_id = auth.uid()));

-- =====================================================
-- TABLE: bookings
-- =====================================================
DROP POLICY "Admins manage all bookings" ON public.bookings;
CREATE POLICY "Admins manage all bookings" ON public.bookings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Customers create bookings" ON public.bookings;
CREATE POLICY "Customers create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY "Customers read own bookings" ON public.bookings;
CREATE POLICY "Customers read own bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id);

DROP POLICY "Customers update own bookings" ON public.bookings;
CREATE POLICY "Customers update own bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = customer_id);

DROP POLICY "Providers read own bookings" ON public.bookings;
CREATE POLICY "Providers read own bookings" ON public.bookings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM providers WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()));

DROP POLICY "Providers update own bookings" ON public.bookings;
CREATE POLICY "Providers update own bookings" ON public.bookings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM providers WHERE providers.id = bookings.provider_id AND providers.user_id = auth.uid()));

DROP POLICY "Servicemen read assigned bookings" ON public.bookings;
CREATE POLICY "Servicemen read assigned bookings" ON public.bookings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM servicemen WHERE servicemen.id = bookings.serviceman_id AND servicemen.user_id = auth.uid()));

DROP POLICY "Servicemen update assigned bookings" ON public.bookings;
CREATE POLICY "Servicemen update assigned bookings" ON public.bookings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM servicemen WHERE servicemen.id = bookings.serviceman_id AND servicemen.user_id = auth.uid()));

-- =====================================================
-- TABLE: cart_item_addons
-- =====================================================
DROP POLICY "Users manage own cart addons" ON public.cart_item_addons;
CREATE POLICY "Users manage own cart addons" ON public.cart_item_addons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM cart_items ci WHERE ci.id = cart_item_addons.cart_item_id AND ci.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM cart_items ci WHERE ci.id = cart_item_addons.cart_item_id AND ci.user_id = auth.uid()));

-- =====================================================
-- TABLE: cart_items
-- =====================================================
DROP POLICY "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE: category_checkout_fields
-- =====================================================
DROP POLICY "Admins manage checkout fields" ON public.category_checkout_fields;
CREATE POLICY "Admins manage checkout fields" ON public.category_checkout_fields FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read checkout fields" ON public.category_checkout_fields;
CREATE POLICY "Anyone can read checkout fields" ON public.category_checkout_fields FOR SELECT USING (true);

-- =====================================================
-- TABLE: chat_messages
-- =====================================================
DROP POLICY "Admins manage all chat messages" ON public.chat_messages;
CREATE POLICY "Admins manage all chat messages" ON public.chat_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Customers manage own booking messages" ON public.chat_messages;
CREATE POLICY "Customers manage own booking messages" ON public.chat_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = chat_messages.booking_id AND bookings.customer_id = auth.uid())) WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = chat_messages.booking_id AND bookings.customer_id = auth.uid()));

DROP POLICY "Providers manage own booking messages" ON public.chat_messages;
CREATE POLICY "Providers manage own booking messages" ON public.chat_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM bookings b JOIN providers p ON p.id = b.provider_id WHERE b.id = chat_messages.booking_id AND p.user_id = auth.uid())) WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM bookings b JOIN providers p ON p.id = b.provider_id WHERE b.id = chat_messages.booking_id AND p.user_id = auth.uid()));

-- =====================================================
-- TABLE: cities
-- =====================================================
DROP POLICY "Admins manage cities" ON public.cities;
CREATE POLICY "Admins manage cities" ON public.cities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active cities" ON public.cities;
CREATE POLICY "Anyone can read active cities" ON public.cities FOR SELECT USING (true);

-- =====================================================
-- TABLE: coupons
-- =====================================================
DROP POLICY "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons" ON public.coupons FOR SELECT USING (true);

-- =====================================================
-- TABLE: customer_addresses
-- =====================================================
DROP POLICY "Admins read all addresses" ON public.customer_addresses;
CREATE POLICY "Admins read all addresses" ON public.customer_addresses FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users manage own addresses" ON public.customer_addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE: employees
-- =====================================================
DROP POLICY "Admins manage employees" ON public.employees;
CREATE POLICY "Admins manage employees" ON public.employees FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Employees read own" ON public.employees;
CREATE POLICY "Employees read own" ON public.employees FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: favorites
-- =====================================================
DROP POLICY "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE: notifications
-- =====================================================
DROP POLICY "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users insert own notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: platform_settings
-- =====================================================
DROP POLICY "Admins manage settings" ON public.platform_settings;
CREATE POLICY "Admins manage settings" ON public.platform_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 1.2: Restrict platform_settings public read to safe keys only
DROP POLICY "Anyone can read settings" ON public.platform_settings;
CREATE POLICY "Anyone can read public settings" ON public.platform_settings FOR SELECT USING (key IN ('site_name', 'site_logo', 'currency', 'tax_rate', 'support_email', 'support_phone', 'terms_url', 'privacy_url'));

-- =====================================================
-- TABLE: pricing_rules
-- =====================================================
DROP POLICY "Admins manage pricing rules" ON public.pricing_rules;
CREATE POLICY "Admins manage pricing rules" ON public.pricing_rules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active pricing rules" ON public.pricing_rules;
CREATE POLICY "Anyone can read active pricing rules" ON public.pricing_rules FOR SELECT USING (true);

DROP POLICY "Providers manage own pricing rules" ON public.pricing_rules;
CREATE POLICY "Providers manage own pricing rules" ON public.pricing_rules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id WHERE s.id = pricing_rules.service_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id WHERE s.id = pricing_rules.service_id AND p.user_id = auth.uid()));

-- =====================================================
-- TABLE: profiles
-- =====================================================
DROP POLICY "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =====================================================
-- TABLE: promotional_banners
-- =====================================================
DROP POLICY "Admins manage banners" ON public.promotional_banners;
CREATE POLICY "Admins manage banners" ON public.promotional_banners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active banners" ON public.promotional_banners;
CREATE POLICY "Anyone can read active banners" ON public.promotional_banners FOR SELECT USING (true);

-- =====================================================
-- TABLE: provider_availability
-- =====================================================
DROP POLICY "Admins manage all availability" ON public.provider_availability;
CREATE POLICY "Admins manage all availability" ON public.provider_availability FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read provider availability" ON public.provider_availability;
CREATE POLICY "Anyone can read provider availability" ON public.provider_availability FOR SELECT USING (true);

DROP POLICY "Providers manage own availability" ON public.provider_availability;
CREATE POLICY "Providers manage own availability" ON public.provider_availability FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM providers WHERE providers.id = provider_availability.provider_id AND providers.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM providers WHERE providers.id = provider_availability.provider_id AND providers.user_id = auth.uid()));

-- =====================================================
-- TABLE: providers
-- =====================================================
DROP POLICY "Admins manage providers" ON public.providers;
CREATE POLICY "Admins manage providers" ON public.providers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 1.2: Restrict public read to active providers only
DROP POLICY "Anyone can read active providers" ON public.providers;
CREATE POLICY "Anyone can read active providers" ON public.providers FOR SELECT USING (status = 'active');

-- Providers can always read their own record regardless of status
CREATE POLICY "Providers read own record" ON public.providers FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Auth users can insert provider" ON public.providers;
CREATE POLICY "Auth users can insert provider" ON public.providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY "Providers update own" ON public.providers;
CREATE POLICY "Providers update own" ON public.providers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: reviews
-- =====================================================
DROP POLICY "Admins manage reviews" ON public.reviews;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY "Customers create reviews" ON public.reviews;
CREATE POLICY "Customers create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- =====================================================
-- TABLE: service_addons
-- =====================================================
DROP POLICY "Admins manage addons" ON public.service_addons;
CREATE POLICY "Admins manage addons" ON public.service_addons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active addons" ON public.service_addons;
CREATE POLICY "Anyone can read active addons" ON public.service_addons FOR SELECT USING (true);

DROP POLICY "Providers manage own addons" ON public.service_addons;
CREATE POLICY "Providers manage own addons" ON public.service_addons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id WHERE s.id = service_addons.service_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id WHERE s.id = service_addons.service_id AND p.user_id = auth.uid()));

-- =====================================================
-- TABLE: service_categories
-- =====================================================
DROP POLICY "Admins manage categories" ON public.service_categories;
CREATE POLICY "Admins manage categories" ON public.service_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read categories" ON public.service_categories;
CREATE POLICY "Anyone can read categories" ON public.service_categories FOR SELECT USING (true);

-- =====================================================
-- TABLE: service_subcategories
-- =====================================================
DROP POLICY "Admins manage subcategories" ON public.service_subcategories;
CREATE POLICY "Admins manage subcategories" ON public.service_subcategories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active subcategories" ON public.service_subcategories;
CREATE POLICY "Anyone can read active subcategories" ON public.service_subcategories FOR SELECT USING (true);

-- =====================================================
-- TABLE: service_variants
-- =====================================================
DROP POLICY "Admins manage variants" ON public.service_variants;
CREATE POLICY "Admins manage variants" ON public.service_variants FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active variants" ON public.service_variants;
CREATE POLICY "Anyone can read active variants" ON public.service_variants FOR SELECT USING (true);

DROP POLICY "Providers manage own variants" ON public.service_variants;
CREATE POLICY "Providers manage own variants" ON public.service_variants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id WHERE s.id = service_variants.service_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM services s JOIN providers p ON p.id = s.provider_id WHERE s.id = service_variants.service_id AND p.user_id = auth.uid()));

-- =====================================================
-- TABLE: servicemen
-- =====================================================
DROP POLICY "Admins manage servicemen" ON public.servicemen;
CREATE POLICY "Admins manage servicemen" ON public.servicemen FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 1.2: Restrict public servicemen read to authenticated users only
DROP POLICY "Anyone can read servicemen" ON public.servicemen;
CREATE POLICY "Authenticated read servicemen" ON public.servicemen FOR SELECT TO authenticated USING (true);

DROP POLICY "Providers manage own servicemen" ON public.servicemen;
CREATE POLICY "Providers manage own servicemen" ON public.servicemen FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM providers WHERE providers.id = servicemen.provider_id AND providers.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM providers WHERE providers.id = servicemen.provider_id AND providers.user_id = auth.uid()));

-- =====================================================
-- TABLE: services
-- =====================================================
DROP POLICY "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Anyone can read active services" ON public.services;
CREATE POLICY "Anyone can read active services" ON public.services FOR SELECT USING (true);

DROP POLICY "Providers manage own services" ON public.services;
CREATE POLICY "Providers manage own services" ON public.services FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM providers WHERE providers.id = services.provider_id AND providers.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM providers WHERE providers.id = services.provider_id AND providers.user_id = auth.uid()));

-- =====================================================
-- TABLE: user_roles
-- =====================================================
DROP POLICY "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- ==========================================================
-- Migration File: 20260308202414_378afbb7-cb16-472a-9aca-b41e1c6bf8c0.sql
-- ==========================================================


-- Add Razorpay payment tracking columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS razorpay_signature text;


-- ==========================================================
-- Migration File: 20260308202833_3b59b150-be7a-4aa5-96d6-7663d21939b8.sql
-- ==========================================================


-- Create storage buckets for service images, provider logos, and user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('service-images', 'service-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('provider-logos', 'provider-logos', true, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- RLS policies for service-images bucket
CREATE POLICY "Providers upload service images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Providers update service images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'service-images');

CREATE POLICY "Providers delete service images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-images');

CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- RLS policies for provider-logos bucket
CREATE POLICY "Providers upload own logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'provider-logos');

CREATE POLICY "Providers update own logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'provider-logos');

CREATE POLICY "Providers delete own logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'provider-logos');

CREATE POLICY "Anyone can view provider logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-logos');


-- ==========================================================
-- Migration File: 20260308211517_2554de6e-be2d-4b34-8347-8e8973236832.sql
-- ==========================================================


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


-- ==========================================================
-- Migration File: 20260309040738_60642d78-7933-4518-9262-b2f20e3fba1e.sql
-- ==========================================================

-- =============================================
-- PHASE 1: Advanced Scheduling Enhancement
-- =============================================

-- Add emergency booking flag to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false;

-- Add buffer_time_minutes to platform_settings (will use INSERT if not exists)
-- This will be done via application logic since platform_settings already exists

-- =============================================
-- PHASE 3: Zone Management System
-- =============================================

-- Create zone_type enum
CREATE TYPE public.zone_type AS ENUM ('all_india', 'state', 'pincode', 'polygon');

-- Create service_zones table
CREATE TABLE public.service_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  zone_type public.zone_type NOT NULL DEFAULT 'polygon',
  -- For state-wise zones
  state_names text[] DEFAULT '{}',
  -- For pincode-based zones
  pincodes text[] DEFAULT '{}',
  -- For polygon zones (GeoJSON coordinates array)
  polygon_coordinates jsonb DEFAULT NULL,
  -- Zone center for map display
  center_lat numeric DEFAULT NULL,
  center_lng numeric DEFAULT NULL,
  -- Metadata
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add zone_id to providers for zone assignment
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.service_zones(id) ON DELETE SET NULL;

-- Add zone_id to services for zone assignment
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.service_zones(id) ON DELETE SET NULL;

-- Add lat/lng to customer_addresses for map-based locations
ALTER TABLE public.customer_addresses 
ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;

-- Add lat/lng to bookings for exact service location
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;

-- Enable RLS on service_zones
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_zones
CREATE POLICY "Admins manage zones" 
ON public.service_zones 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active zones" 
ON public.service_zones 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_service_zones_updated_at
  BEFORE UPDATE ON public.service_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add index for zone lookups
CREATE INDEX idx_service_zones_type ON public.service_zones(zone_type);
CREATE INDEX idx_service_zones_active ON public.service_zones(is_active);
CREATE INDEX idx_providers_zone ON public.providers(zone_id);
CREATE INDEX idx_services_zone ON public.services(zone_id);

-- ==========================================================
-- Migration File: 20260309042320_bdba6cfd-c7d3-402b-9eb8-28962f28a2ee.sql
-- ==========================================================


-- Phase 2: Provider verification documents
CREATE TABLE public.provider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL DEFAULT 'id_proof',
  document_name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- Providers can manage own documents
CREATE POLICY "Providers manage own documents"
ON public.provider_documents FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.providers WHERE providers.id = provider_documents.provider_id AND providers.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.providers WHERE providers.id = provider_documents.provider_id AND providers.user_id = auth.uid()
));

-- Admins manage all documents
CREATE POLICY "Admins manage all documents"
ON public.provider_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add verification columns to providers
ALTER TABLE public.providers 
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider-documents bucket
CREATE POLICY "Providers upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'provider-documents' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.providers WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Admins manage all provider documents"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'));


-- ==========================================================
-- Migration File: 20260309045752_365c67fa-51c1-4dde-9884-603f6320feef.sql
-- ==========================================================

-- Add tax fields to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_type text DEFAULT 'none';

-- Add CRUD mutations for service_variants (admin manages variants inline)
-- Variants already exist, just need to ensure we can manage them from admin

-- ==========================================================
-- Migration File: 20260317072954_bc2a39d3-6b9b-4016-8202-c0ab93f1cd3e.sql
-- ==========================================================

ALTER TABLE public.providers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.providers ALTER COLUMN user_id SET DEFAULT NULL;

-- ==========================================================
-- Migration File: 20260427000001_seed_initial_data_delhi.sql
-- ==========================================================

-- ============================================================================
-- Initial seed data: Delhi / South Delhi launch
-- Source: services_data_export.json (8 categories, 15 subcategories, 15 services)
-- Idempotent via deterministic UUIDs + ON CONFLICT (id) DO NOTHING.
-- ============================================================================

-- ---------- 1. City: Delhi ----------
INSERT INTO public.cities (id, name, state, is_active) VALUES
  ('11110000-0000-4000-8000-000000000001', 'Delhi', 'Delhi', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Service zone: South Delhi ----------
-- zone_type = 'pincode' so admins can later attach actual South Delhi pincodes
-- (Hauz Khas 110016, Saket 110017, Vasant Kunj 110070, etc.) from /admin/zones
INSERT INTO public.service_zones (id, name, zone_type, pincodes, is_active) VALUES
  ('22220000-0000-4000-8000-000000000001', 'South Delhi', 'pincode', ARRAY[]::text[], true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 3. Platform provider ----------
-- Single placeholder provider that owns all initial services. user_id is NULL
-- (allowed since 2026-03-17 migration). Real providers onboard via /admin/providers.
INSERT INTO public.providers (
  id, user_id, company_name, owner_name, email, phone, address,
  status, is_verified, verified_at, city_id, zone_id, rating
) VALUES (
  '33330000-0000-4000-8000-000000000001',
  NULL,
  'Surya Home Service',
  'Surya Home Service',
  'support@suryahomeservice.com',
  '',
  'South Delhi, Delhi',
  'active',
  true,
  now(),
  '11110000-0000-4000-8000-000000000001',
  '22220000-0000-4000-8000-000000000001',
  0
) ON CONFLICT (id) DO NOTHING;

-- ---------- 4. Service categories (8) ----------
INSERT INTO public.service_categories (id, name, description, icon, commission_rate, category_type, is_active) VALUES
  ('44440000-0000-4000-8000-000000000001', 'Floor & Appliance Cleaning', 'Deep cleaning of floors, refrigerators, and home appliances', 'Refrigerator', 20, 'standard', true),
  ('44440000-0000-4000-8000-000000000002', 'Window & Glass Cleaning',    'Streak-free cleaning of windows, glass doors, and panels',    'Square',       20, 'standard', true),
  ('44440000-0000-4000-8000-000000000003', 'Car Cleaning',               'Doorstep car wash and interior detailing',                    'Car',          20, 'standard', true),
  ('44440000-0000-4000-8000-000000000004', 'Balcony & Utility Cleaning', 'Balcony, terrace, and utility area cleaning',                 'Trees',        20, 'standard', true),
  ('44440000-0000-4000-8000-000000000005', 'Kitchen Cleaning',           'Kitchen accessories, chimney, and complete deep cleans',      'Utensils',     20, 'standard', true),
  ('44440000-0000-4000-8000-000000000006', 'Home Cleaning',              'Full-home cleaning including move-in / move-out services',    'Home',         20, 'standard', true),
  ('44440000-0000-4000-8000-000000000007', 'Painting Services',          'Interior, exterior, and furniture painting',                  'PaintBucket',  20, 'standard', true),
  ('44440000-0000-4000-8000-000000000008', 'Cleaning Services',          'Sofa, upholstery, and bathroom deep cleaning',                'Sparkles',     20, 'standard', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 5. Service subcategories (15) ----------
INSERT INTO public.service_subcategories (id, category_id, name, description, icon, is_active) VALUES
  ('55550000-0000-4000-8000-000000000001', '44440000-0000-4000-8000-000000000001', 'Appliance Cleaning',            'Refrigerator, microwave, washing machine cleaning',       'Refrigerator', true),
  ('55550000-0000-4000-8000-000000000002', '44440000-0000-4000-8000-000000000001', 'Floor Cleaning',                'Tile, marble, and hardwood floor scrubbing',              'Brush',        true),
  ('55550000-0000-4000-8000-000000000003', '44440000-0000-4000-8000-000000000002', 'Window Cleaning',               'Window panes, glass doors, and grills',                   'Square',       true),
  ('55550000-0000-4000-8000-000000000004', '44440000-0000-4000-8000-000000000003', 'Car Wash',                      'Exterior wash and interior vacuum',                       'Car',          true),
  ('55550000-0000-4000-8000-000000000005', '44440000-0000-4000-8000-000000000004', 'Balcony Cleaning',              'Balcony floor, railing, and grill cleaning',              'Trees',        true),
  ('55550000-0000-4000-8000-000000000006', '44440000-0000-4000-8000-000000000005', 'Kitchen Accessories Cleaning',  'Chimney, hob, exhaust fan deep cleaning',                 'ChefHat',      true),
  ('55550000-0000-4000-8000-000000000007', '44440000-0000-4000-8000-000000000005', 'Complete Kitchen Cleaning',     'Full kitchen deep clean with cabinets and slabs',         'Utensils',     true),
  ('55550000-0000-4000-8000-000000000008', '44440000-0000-4000-8000-000000000006', 'Empty / Move-In Cleaning',      'Pre-move sanitization for empty homes',                   'PackageOpen',  true),
  ('55550000-0000-4000-8000-000000000009', '44440000-0000-4000-8000-000000000006', 'Full Home Cleaning',            'Whole-home deep cleaning across all rooms',               'Home',         true),
  ('55550000-0000-4000-8000-00000000000a', '44440000-0000-4000-8000-000000000007', 'Furniture & Fixture Painting',  'Doors, cabinets, wooden furniture, metal fixtures',       'Brush',        true),
  ('55550000-0000-4000-8000-00000000000b', '44440000-0000-4000-8000-000000000007', 'Outdoor & Utility Area Painting','Exterior walls and utility area painting',               'PaintBucket',  true),
  ('55550000-0000-4000-8000-00000000000c', '44440000-0000-4000-8000-000000000007', 'Room Painting',                 'Single room painting with primer and finish coats',       'Paintbrush',   true),
  ('55550000-0000-4000-8000-00000000000d', '44440000-0000-4000-8000-000000000007', 'Full House Painting Packages',  'Complete house interior painting packages',               'Palette',      true),
  ('55550000-0000-4000-8000-00000000000e', '44440000-0000-4000-8000-000000000008', 'Sofa Cleaning',                 'Upholstery shampooing and stain treatment',               'Sofa',         true),
  ('55550000-0000-4000-8000-00000000000f', '44440000-0000-4000-8000-000000000008', 'Bathroom & WC Cleaning',        'Toilet, washbasin, and bathroom fixture cleaning',        'Bath',         true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 6. Services (15) ----------
-- Pricing taken from min_price in source data. Currency stripped (₹2,690.00 -> 2690).
-- Duration is an estimate; admins can adjust per service.
INSERT INTO public.services (
  id, category_id, subcategory_id, provider_id, city_id, zone_id,
  name, description, price, duration, rating, review_count, is_active
) VALUES
  -- Floor & Appliance Cleaning
  ('66660000-0000-4000-8000-000000000001',
   '44440000-0000-4000-8000-000000000001', '55550000-0000-4000-8000-000000000001',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Fridge Cleaning',
   'Deep cleaning of refrigerator interior and exterior. Removes stains, odors, and food residue. Includes shelves, drawers, and door gasket sanitization.',
   480, 60, 0, 0, true),

  ('66660000-0000-4000-8000-000000000002',
   '44440000-0000-4000-8000-000000000001', '55550000-0000-4000-8000-000000000002',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Floor Cleaning Service',
   'Professional floor scrubbing and mopping for tiles, marble, and hardwood. Starting at ₹45 per square foot.',
   45, 45, 0, 0, true),

  -- Window & Glass Cleaning
  ('66660000-0000-4000-8000-000000000003',
   '44440000-0000-4000-8000-000000000002', '55550000-0000-4000-8000-000000000003',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Window / Glass Cleaning Service',
   'Streak-free cleaning of windows, glass doors, and panels. Both interior and exterior surfaces handled.',
   499, 60, 0, 0, true),

  -- Car Cleaning
  ('66660000-0000-4000-8000-000000000004',
   '44440000-0000-4000-8000-000000000003', '55550000-0000-4000-8000-000000000004',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Car Wash Service',
   'Complete exterior wash and interior vacuuming at your doorstep. Eco-friendly cleaning agents and microfiber finish.',
   499, 45, 0, 0, true),

  -- Balcony & Utility Cleaning
  ('66660000-0000-4000-8000-000000000005',
   '44440000-0000-4000-8000-000000000004', '55550000-0000-4000-8000-000000000005',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Balcony Cleaning Service',
   'Thorough scrubbing of balcony floors, railings, and grills. Includes cobweb removal and disinfection.',
   369, 60, 0, 0, true),

  -- Kitchen Cleaning
  ('66660000-0000-4000-8000-000000000006',
   '44440000-0000-4000-8000-000000000005', '55550000-0000-4000-8000-000000000006',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Kitchen Accessories Cleaning Service',
   'Deep cleaning of chimney, hob, exhaust fan, and microwave. Removes oil and grease buildup.',
   399, 60, 0, 0, true),

  ('66660000-0000-4000-8000-000000000007',
   '44440000-0000-4000-8000-000000000005', '55550000-0000-4000-8000-000000000007',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Complete Kitchen Cleaning Service',
   'Full kitchen deep clean including cabinets, slabs, sink, appliances, and tiles. Removes grease and stains.',
   999, 180, 0, 0, true),

  -- Home Cleaning
  ('66660000-0000-4000-8000-000000000008',
   '44440000-0000-4000-8000-000000000006', '55550000-0000-4000-8000-000000000008',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Empty / Move-In Cleaning Service',
   'Pre-move sanitization for empty homes. Floor scrubbing, dusting, cobweb removal, and disinfection.',
   350, 240, 0, 0, true),

  ('66660000-0000-4000-8000-000000000009',
   '44440000-0000-4000-8000-000000000006', '55550000-0000-4000-8000-000000000009',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Home Cleaning Service',
   'Professional whole-home deep cleaning across all rooms, bathrooms, and kitchen. Premium-grade equipment.',
   2690, 240, 0, 0, true),

  -- Painting Services
  ('66660000-0000-4000-8000-00000000000a',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000a',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Furniture & Fixture Painting',
   'Custom painting for doors, cabinets, wooden furniture, and metal fixtures. Premium enamel finish.',
   1349, 180, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000b',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000b',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Outdoor & Utility Area Painting',
   'Exterior wall and utility area painting with weatherproof finish.',
   2300, 240, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000c',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000c',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Single Room Painting',
   'Complete painting of one room including walls, ceiling, prep work, primer, and two coats of premium paint.',
   2339, 360, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000d',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000d',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'House Painting Packages',
   'Full house interior painting package. Includes prep, primer, two coats of premium paint, and post-job clean-up.',
   9000, 480, 0, 0, true),

  -- Cleaning Services (general)
  ('66660000-0000-4000-8000-00000000000e',
   '44440000-0000-4000-8000-000000000008', '55550000-0000-4000-8000-00000000000e',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Sofa Cleaning',
   'Deep upholstery shampooing and stain treatment. Starting at ₹125 per seat.',
   125, 90, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000f',
   '44440000-0000-4000-8000-000000000008', '55550000-0000-4000-8000-00000000000f',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'WC / Toilet Cleaning',
   'Disinfection and deep cleaning of toilet, washbasin, and bathroom fixtures.',
   249, 60, 0, 0, true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- Migration File: 20260427000002_add_toilet_variants_and_fan_cleaning.sql
-- ==========================================================

-- ============================================================================
-- Add toilet/bathroom variants + ceiling fan cleaning service
-- Source: client WhatsApp (2026-04-27)
-- Placeholder prices ₹999 for Classic / Deep / Move-in Intense — update later
-- when client confirms.
-- ============================================================================

-- ---------- 1. Variants for "WC / Toilet Cleaning" ----------
-- Base service id: 66660000-0000-4000-8000-00000000000f
INSERT INTO public.service_variants (id, service_id, name, description, price, duration, is_active) VALUES
  ('77770000-0000-4000-8000-000000000001',
   '66660000-0000-4000-8000-00000000000f',
   'Classic',
   'Basic toilet cleaning — WC, washbasin, and floor scrubbing.',
   999, 60, true),

  ('77770000-0000-4000-8000-000000000002',
   '66660000-0000-4000-8000-00000000000f',
   'Deep Cleaning',
   'Premium deep cleaning — descaling, disinfection, tile and grout treatment.',
   999, 90, true),

  ('77770000-0000-4000-8000-000000000003',
   '66660000-0000-4000-8000-00000000000f',
   'Badi Toilet (Large)',
   'Large bathroom variant — bathtub, multiple fixtures, full deep clean.',
   700, 90, true),

  ('77770000-0000-4000-8000-000000000004',
   '66660000-0000-4000-8000-00000000000f',
   'Move-in Intense',
   'Intense bathroom cleaning for move-in / move-out — sanitization, scaling, full disinfection.',
   999, 120, true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. New service: Ceiling Fan Cleaning ----------
-- Category:    Floor & Appliance Cleaning  (44440000-...-000000000001)
-- Subcategory: Appliance Cleaning           (55550000-...-000000000001)
INSERT INTO public.services (
  id, category_id, subcategory_id, provider_id, city_id, zone_id,
  name, description, price, duration, rating, review_count, is_active
) VALUES
  ('66660000-0000-4000-8000-000000000010',
   '44440000-0000-4000-8000-000000000001',
   '55550000-0000-4000-8000-000000000001',
   '33330000-0000-4000-8000-000000000001',
   '11110000-0000-4000-8000-000000000001',
   '22220000-0000-4000-8000-000000000001',
   'Ceiling Fan Cleaning',
   'Dust and grease removal for ceiling fans. Blade scrubbing and motor housing wipe-down. Priced per fan.',
   50, 30, 0, 0, true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- Migration File: 20260427000003_add_service_images_and_chimney_variant.sql
-- ==========================================================

-- ============================================================================
-- Add service images (hot-linked from external sites — temporary, replace with
-- Supabase Storage uploads before going live) + Chimney Only variant.
-- Source: client-provided URLs (2026-04-27)
-- ============================================================================

-- ---------- 1. Service images ----------

-- Ceiling Fan Cleaning
UPDATE public.services
SET image_url = 'https://www.urbanambiance.com/cdn/shop/articles/how-to-clean-a-ceiling-fan-diy-tips-to-enhance-your-space-174105_300x.jpg?v=1660291392'
WHERE id = '66660000-0000-4000-8000-000000000010';

-- Kitchen Accessories Cleaning Service (will host Chimney variant too)
UPDATE public.services
SET image_url = 'https://content.jdmagicbox.com/v2/comp/delhi/v6/011pxx11.xx11.240218153719.q2v6/catalogue/cleaning-guru-kalkaji-delhi-housekeeping-services-l0tzosod8f-250.jpg'
WHERE id = '66660000-0000-4000-8000-000000000006';

-- Complete Kitchen Cleaning Service
UPDATE public.services
SET image_url = 'https://www.bondcleaningincanberra.com.au/wp-content/uploads/2022/05/hero-3.webp'
WHERE id = '66660000-0000-4000-8000-000000000007';

-- WC / Toilet Cleaning
UPDATE public.services
SET image_url = 'https://way2cleaning.com/wp-content/uploads/2025/02/bathroom-deep-cleaning.png'
WHERE id = '66660000-0000-4000-8000-00000000000f';

-- Home Cleaning Service
UPDATE public.services
SET image_url = 'https://way2cleaning.com/wp-content/uploads/2025/03/Occupied-Apartment-Cleaning.png'
WHERE id = '66660000-0000-4000-8000-000000000009';


-- ---------- 2. Chimney Only variant ----------
-- Added to existing "Kitchen Accessories Cleaning Service" (id ...000000000006)
INSERT INTO public.service_variants (id, service_id, name, description, price, duration, is_active) VALUES
  ('77770000-0000-4000-8000-000000000005',
   '66660000-0000-4000-8000-000000000006',
   'Chimney Only',
   'Specialized chimney deep cleaning — duct, mesh filter, and motor housing degrease.',
   999, 90, true)
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- Migration File: 20260427000004_add_unsplash_images_remaining_services.sql
-- ==========================================================

-- ============================================================================
-- Add Unsplash images for remaining 11 services.
-- Source: Unsplash search results (free, royalty-free, hotlink-friendly CDN).
-- These are temporary — replace with Supabase Storage uploads before going live.
-- Width reduced to 1200px (from 3000px) for faster loading.
-- ============================================================================

-- Fridge Cleaning
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1762545352529-1e624dad0548?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000001';

-- Floor Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1749214317455-efbdd57df844?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000002';

-- Window / Glass Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1482449609509-eae2a7ea42b7?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000003';

-- Car Wash Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000004';

-- Balcony Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1649671965270-ab7ed6aaa709?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000005';

-- Empty / Move-In Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1632208962087-2719e5e57886?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000008';

-- Furniture & Fixture Painting
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1612908317776-a3afde8232fa?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000a';

-- Outdoor & Utility Area Painting
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1774977737078-7ccc2ac697e6?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000b';

-- Single Room Painting
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000c';

-- House Painting Packages
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1666179861891-db5155e290c3?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000d';

-- Sofa Cleaning
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1686178827149-6d55c72d81df?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000e';


-- ==========================================================
-- Migration File: 20260427000005_add_category_images.sql
-- ==========================================================

-- ============================================================================
-- Add Unsplash images for all 8 service categories.
-- Source: Unsplash (free, royalty-free, hotlink-friendly).
-- Width 1200px for fast loading on category tile views.
-- ============================================================================

-- Floor & Appliance Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000001';

-- Window & Glass Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1527352774566-e4916e36c645?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000002';

-- Car Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000003';

-- Balcony & Utility Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1486484290742-0ce4eb743a34?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000004';

-- Kitchen Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000005';

-- Home Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000006';

-- Painting Services
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1629941633816-a1d688cb2d1d?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000007';

-- Cleaning Services (Sofa, Bathroom)
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000008';


-- ==========================================================
-- Migration File: 20260616_otp_verifications.sql
-- ==========================================================

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


-- ==========================================================
-- Extra File: create_missing_tables.sql
-- ==========================================================

-- Create missing tables and RPC functions for multi-vendor partner system

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add location coordinates to existing providers table if missing
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS longitude double precision;

-- 1. Table: provider_employees
CREATE TABLE IF NOT EXISTS public.provider_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(provider_id, user_id)
);

ALTER TABLE public.provider_employees ENABLE ROW LEVEL SECURITY;

-- Policies for provider_employees
DROP POLICY IF EXISTS "Providers manage own employees" ON public.provider_employees;
CREATE POLICY "Providers manage own employees" ON public.provider_employees
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.providers
            WHERE providers.id = provider_employees.provider_id
              AND providers.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.providers
            WHERE providers.id = provider_employees.provider_id
              AND providers.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Employees view own provider data" ON public.provider_employees;
CREATE POLICY "Employees view own provider data" ON public.provider_employees
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all provider employees" ON public.provider_employees;
CREATE POLICY "Admins manage all provider employees" ON public.provider_employees
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 2. Table: ad_campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    daily_budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
    spent_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    bid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.05,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for ad_campaigns
DROP POLICY IF EXISTS "Providers manage own campaigns" ON public.ad_campaigns;
CREATE POLICY "Providers manage own campaigns" ON public.ad_campaigns
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.providers
            WHERE providers.id = ad_campaigns.provider_id
              AND providers.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.providers
            WHERE providers.id = ad_campaigns.provider_id
              AND providers.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Anyone can read active campaigns" ON public.ad_campaigns;
CREATE POLICY "Anyone can read active campaigns" ON public.ad_campaigns
    FOR SELECT TO public
    USING (status = 'active');

DROP POLICY IF EXISTS "Admins manage all campaigns" ON public.ad_campaigns;
CREATE POLICY "Admins manage all campaigns" ON public.ad_campaigns
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 3. Table: ad_analytics
CREATE TABLE IF NOT EXISTS public.ad_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for ad_analytics
DROP POLICY IF EXISTS "Anyone can insert ad analytics" ON public.ad_analytics;
CREATE POLICY "Anyone can insert ad analytics" ON public.ad_analytics
    FOR INSERT TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Providers read own campaign analytics" ON public.ad_analytics;
CREATE POLICY "Providers read own campaign analytics" ON public.ad_analytics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ad_campaigns c
            JOIN public.providers p ON p.id = c.provider_id
            WHERE c.id = ad_analytics.campaign_id
              AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins read all ad analytics" ON public.ad_analytics;
CREATE POLICY "Admins read all ad analytics" ON public.ad_analytics
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 4. RPC Functions

-- RPC 4.1: get_targeted_ads
CREATE OR REPLACE FUNCTION public.get_targeted_ads(
    p_city_id uuid DEFAULT NULL,
    p_category_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 5
)
RETURNS SETOF public.ad_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.ad_campaigns
    WHERE status = 'active'
      AND (city_id = p_city_id OR city_id IS NULL)
      AND (category_id = p_category_id OR category_id IS NULL)
      AND (start_date <= CURRENT_DATE AND (end_date IS NULL OR end_date >= CURRENT_DATE))
    ORDER BY bid_amount DESC, created_at DESC
    LIMIT p_limit;
END;
$$;


-- RPC 4.2: create_provider_employee
CREATE OR REPLACE FUNCTION public.create_provider_employee(
    p_provider_id uuid,
    p_name text,
    p_email text,
    p_phone text,
    p_password text,
    p_permissions text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', p_name),
        now(),
        now()
    )
    RETURNING id INTO new_user_id;

    -- Update user role to 'provider_employee'
    DELETE FROM public.user_roles WHERE user_id = new_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'provider_employee');

    -- Insert provider employee record
    INSERT INTO public.provider_employees (
        provider_id, user_id, name, email, phone, permissions, created_at
    )
    VALUES (
        p_provider_id,
        new_user_id,
        p_name,
        p_email,
        COALESCE(p_phone, ''),
        p_permissions,
        now()
    );

    RETURN new_user_id;
END;
$$;


-- RPC 4.3: create_admin_employee
CREATE OR REPLACE FUNCTION public.create_admin_employee(
    p_name text,
    p_email text,
    p_password text,
    p_department text,
    p_permissions text[],
    p_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', p_name),
        now(),
        now()
    )
    RETURNING id INTO new_user_id;

    -- Update user role to 'employee'
    DELETE FROM public.user_roles WHERE user_id = new_user_id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'employee');

    -- Insert employee record
    INSERT INTO public.employees (
        user_id, name, email, phone, department, permissions, status, created_at
    )
    VALUES (
        new_user_id,
        p_name,
        p_email,
        COALESCE(p_phone, ''),
        p_department,
        p_permissions,
        'active',
        now()
    );

    RETURN new_user_id;
END;
$$;


-- 5. Sync Existing Active Providers to get the 'provider' role
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'provider'::public.app_role
FROM public.providers
WHERE status = 'active' AND user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;


-- 6. Recreate foreign key relationship between bookings and profiles to enable PostgREST joins
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 7. Recreate foreign key relationship between reviews and profiles to enable PostgREST joins
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;




-- ==========================================================
-- Prerequisites for Bihar Services Migration
-- ==========================================================
INSERT INTO public.service_zones (id, name, zone_type, is_active)
VALUES ('5ce29515-d1ff-403a-899b-564996753fa9', 'Bihar Zone', 'polygon', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.providers (id, user_id, company_name, owner_name, email, phone, status, zone_id)
VALUES ('5b0ed0a7-7c34-4eda-852e-c7a32f469386', NULL, 'Digital Studio', 'Digital Studio Owner', 'digitalstudio@suryahome.com', '9999999999', 'active', '5ce29515-d1ff-403a-899b-564996753fa9')
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- Extra File: migration_bihar_all.sql
-- ==========================================================

-- Migration for Bihar Services (All categories and services from SQL)
BEGIN;
-- Provider: Digital Studio (5b0ed0a7-7c34-4eda-852e-c7a32f469386)
-- Zone: Bihar (5ce29515-d1ff-403a-899b-564996753fa9)

-- 1. Insert Categories
INSERT INTO public.service_categories (id, name, is_active) VALUES ('17082033-bfd1-49e4-99bf-db05b821bea9', 'Vehicle', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_categories (id, name, is_active) VALUES ('c7843255-4208-414f-a106-0b2b620154f0', 'Makeup Service', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_categories (id, name, is_active) VALUES ('2a58f76a-63d9-417e-9f52-51a77ed086c0', 'DJ Service', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_categories (id, name, is_active) VALUES ('a05114e2-4b9f-4192-9941-421b9707892e', 'Decoration', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_categories (id, name, is_active) VALUES ('84ee0286-1a68-448b-87c0-3a57b6361f28', 'Camera', true) ON CONFLICT DO NOTHING;

-- 2. Insert Subcategories
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('e2bc1e92-0a3f-4966-a21a-6fa3681fc221', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Wide angle photo', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('ec63f2dd-aaeb-42c1-b995-8c6d1209eedd', 'a05114e2-4b9f-4192-9941-421b9707892e', 'Dulha Car Decoration', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('8783e0ee-ed96-4fde-8ed8-e6c2818e577e', 'a05114e2-4b9f-4192-9941-421b9707892e', 'Stage Decoration', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('d425cf80-3654-4fc4-a0aa-afea017cdc2c', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Videography', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('2c17a80f-623e-4392-8d7b-65088c07bbbe', 'c7843255-4208-414f-a106-0b2b620154f0', 'HD Finish Makeup', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('33d1b578-d4bc-479f-b086-da1cfce9d6ea', 'c7843255-4208-414f-a106-0b2b620154f0', 'Basic Makeup', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('5e5d4604-f6f9-4709-8eca-05beb11de0c0', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Cinematic', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('1e2b312b-5086-40e1-95bf-e640cf699017', '17082033-bfd1-49e4-99bf-db05b821bea9', 'Dulha Car', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('96c55193-f92a-4ed5-8d15-4bf0a1246a3d', 'c7843255-4208-414f-a106-0b2b620154f0', 'Bridal Makeup', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('e46386f9-9548-41c5-bfa3-c69955ba7873', 'a05114e2-4b9f-4192-9941-421b9707892e', 'Bed Decoration', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('bc42df9e-45b9-4078-80a4-8092c8a43870', 'a05114e2-4b9f-4192-9941-421b9707892e', 'Mandap Decoration', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('f39a7f99-9558-4536-b9dc-b97ded5b2ced', '17082033-bfd1-49e4-99bf-db05b821bea9', 'Cars', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('27204835-c265-4cf8-97ee-d5ebcfde937d', 'a05114e2-4b9f-4192-9941-421b9707892e', 'Gate Decoration', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('4bf295ff-bac9-4f06-9bc3-ef9e7108abbd', '2a58f76a-63d9-417e-9f52-51a77ed086c0', 'Bhangra', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('887adb37-ca35-411e-a089-b6477c5867f4', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Pre Wedding Shoot', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('cf05a55d-1082-45d3-b8b9-67efad51daa8', 'c7843255-4208-414f-a106-0b2b620154f0', 'Mehndi Artist', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('ebae3402-bb69-40c3-a9cf-26bbcefee9f5', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Drone', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('6d64ad0b-30ba-45ea-a2f4-2f62596b58ea', 'c7843255-4208-414f-a106-0b2b620154f0', 'Premium Makeup', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('4be219eb-7f3e-485a-8674-037e0be9722c', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Still Photography', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('11e7ac46-5623-49ad-9187-f1ed29c85b88', '2a58f76a-63d9-417e-9f52-51a77ed086c0', 'Band Baza', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('e6d3193f-7aca-47f8-8815-a1dd6c35375e', '17082033-bfd1-49e4-99bf-db05b821bea9', 'Bus', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('6fad51b4-ba00-4441-a916-b9591960d7ca', '2a58f76a-63d9-417e-9f52-51a77ed086c0', 'DJ', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('03ea9da1-e723-49ae-b7ad-8773eec56cb4', '84ee0286-1a68-448b-87c0-3a57b6361f28', '4k Video', true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_subcategories (id, category_id, name, is_active) VALUES ('2d810793-8b5d-4df6-aa53-081e085b546c', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'Candid', true) ON CONFLICT DO NOTHING;

-- 3. Insert Services & Variants
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('1dbb7663-747a-447c-9f7a-abc9c9c6156f', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'e2bc1e92-0a3f-4966-a21a-6fa3681fc221', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Wide angle photo', '<h3 data-start=\"462\" data-end=\"520\">ð Wide Angle Photo Shoot &ndash; Starting from â¹7,999/day</h3>\r\n<p data-start=\"522\" data-end=\"933\">à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ grand moments aur bade-bade setups ko capture karne ka best tareeka hai wide angle photography. Vivah Bazaar ka <strong data-start=\"647\" data-end=\"681\">Wide Angle Photo Shoot Package</strong> aapke venue, mandap, stage aur crowd ke emotions ko ek hi frame me beautifully capture karta hai. à¤¹à¤®à¤¾à¤°à¥ professional team high-quality wide angle lenses aur latest equipment ke saath shoot karti hai, taaki har photo ekà¤¦à¤® cinematic aur royal look deà¥¤</p>\r\n<p data-start=\"935\" data-end=\"964\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"966\" data-end=\"1311\">\r\n<li data-start=\"966\" data-end=\"1022\">\r\n<p data-start=\"968\" data-end=\"1022\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ wide angle coverage (â¹7,999/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"1023\" data-end=\"1080\">\r\n<p data-start=\"1025\" data-end=\"1080\">Experienced wide angle photographers à¤à¥ dedicated à¤à¥à¤®</p>\r\n</li>\r\n<li data-start=\"1081\" data-end=\"1135\">\r\n<p data-start=\"1083\" data-end=\"1135\">Venue, stage, mandap aur crowd ke grand wide shots</p>\r\n</li>\r\n<li data-start=\"1136\" data-end=\"1198\">\r\n<p data-start=\"1138\" data-end=\"1198\">Creative angles aur natural light ke saath premium editing</p>\r\n</li>\r\n<li data-start=\"1199\" data-end=\"1259\">\r\n<p data-start=\"1201\" data-end=\"1259\">High-resolution digital album aur sharing-friendly files</p>\r\n</li>\r\n<li data-start=\"1260\" data-end=\"1311\">\r\n<p data-start=\"1262\" data-end=\"1311\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization aur add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1313\" data-end=\"1538\">à¤à¤¾à¤¹à¥ varmala ceremony ka royal mandap ho, sangeet ki lighting, bride-groom ki grand entry ya pura crowd ek hi frame me &ndash; à¤¹à¤®à¤¾à¤°à¥ team ensure karti hai ki wide angle shots à¤à¤ªà¤à¥ shaadi ko ek <strong data-start=\"1500\" data-end=\"1525\">grand cinematic story</strong> bana deinà¥¤</p>\r\n<p data-start=\"1540\" data-end=\"1602\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Wide Angle Photography Services?</p>\r\n<ul data-start=\"1604\" data-end=\"1795\">\r\n<li data-start=\"1604\" data-end=\"1646\">\r\n<p data-start=\"1606\" data-end=\"1646\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹7,999/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1647\" data-end=\"1692\">\r\n<p data-start=\"1649\" data-end=\"1692\">100+ successful wedding projects à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1693\" data-end=\"1739\">\r\n<p data-start=\"1695\" data-end=\"1739\">Creative wide shots + professional editing</p>\r\n</li>\r\n<li data-start=\"1740\" data-end=\"1795\">\r\n<p data-start=\"1742\" data-end=\"1795\">Timely delivery à¤à¤° client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1797\" data-end=\"1928\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ responsibility à¤¹à¥ ki hum us grandness ko hamesha à¤à¥ à¤²à¤¿à¤ à¤¸à¤à¤à¥à¤à¤° à¤°à¤à¥à¤à¥¤</p>\r\n<p data-start=\"1930\" data-end=\"2013\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ aur apne wedding album ko ek royal wide angle cinematic look à¤¦à¥à¤!</p>', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('1dbb7663-747a-447c-9f7a-abc9c9c6156f', 'Wide-angle-photo-shoot-(Price-starts-from)', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('404a6ea4-b59f-4500-994d-962f7b7caa80', 'c7843255-4208-414f-a106-0b2b620154f0', '6d64ad0b-30ba-45ea-a2f4-2f62596b58ea', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Premium Makeup', '<p data-start=\"69\" data-end=\"123\">ð <strong data-start=\"72\" data-end=\"121\">Premium Makeup Service &ndash; Starting from â¹3,999</strong></p>\r\n<p data-start=\"125\" data-end=\"360\">à¤¶à¤¾à¤¦à¥ à¤¯à¤¾ à¤à¤¿à¤¸à¥ à¤­à¥ à¤à¤¾à¤¸ à¤¦à¤¿à¤¨ à¤ªà¤° à¤¹à¤° à¤²à¤¡à¤¼à¤à¥ à¤à¤¾à¤¹à¤¤à¥ à¤¹à¥ à¤à¤¿ à¤à¤¸à¤à¤¾ look à¤¹à¥ <em data-start=\"186\" data-end=\"207\">royal aur glamorous</em>à¥¤ Vivah Bazaar à¤à¤¾ Premium Makeup Package à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"261\" data-end=\"305\">luxury products ke saath flawless makeover</em>, à¤¤à¤¾à¤à¤¿ à¤à¤ªà¤à¤¾ à¤¹à¤° moment à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤à¤° à¤¹à¤° photo perfect à¤¬à¤¨à¥à¥¤</p>\r\n<p data-start=\"362\" data-end=\"395\">â¨ <strong data-start=\"364\" data-end=\"393\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"396\" data-end=\"676\">\r\n<li data-start=\"396\" data-end=\"435\">\r\n<p data-start=\"398\" data-end=\"435\">Premium Makeup à¤¸à¤¿à¤°à¥à¤« â¹3,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"436\" data-end=\"500\">\r\n<p data-start=\"438\" data-end=\"500\">Professional makeup artists aur branded products à¤à¤¾ à¤à¤¸à¥à¤¤à¥à¤®à¤¾à¤²</p>\r\n</li>\r\n<li data-start=\"501\" data-end=\"555\">\r\n<p data-start=\"503\" data-end=\"555\">Customized look &ndash; Traditional, Modern ya Glamorous</p>\r\n</li>\r\n<li data-start=\"556\" data-end=\"608\">\r\n<p data-start=\"558\" data-end=\"608\">Premium hair styling aur basic accessories setup</p>\r\n</li>\r\n<li data-start=\"609\" data-end=\"676\">\r\n<p data-start=\"611\" data-end=\"676\">Long-lasting aur skin-friendly makeup jo à¤ªà¥à¤°à¥ function tak à¤à¤¿à¤à¥</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"678\" data-end=\"736\">ð <strong data-start=\"681\" data-end=\"734\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Premium Makeup Services?</strong></p>\r\n<ul data-start=\"737\" data-end=\"993\">\r\n<li data-start=\"737\" data-end=\"775\">\r\n<p data-start=\"739\" data-end=\"775\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹3,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"776\" data-end=\"830\">\r\n<p data-start=\"778\" data-end=\"830\">Experienced aur professional bridal makeup artists</p>\r\n</li>\r\n<li data-start=\"831\" data-end=\"878\">\r\n<p data-start=\"833\" data-end=\"878\">Branded aur premium quality products à¤à¤¾ use</p>\r\n</li>\r\n<li data-start=\"879\" data-end=\"937\">\r\n<p data-start=\"881\" data-end=\"937\">Customized royal look jo à¤à¤ªà¤à¥ personality ko à¤à¤° à¤¨à¤¿à¤à¤¾à¤°à¥</p>\r\n</li>\r\n<li data-start=\"938\" data-end=\"993\">\r\n<p data-start=\"940\" data-end=\"993\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"995\" data-end=\"1151\">ð à¤¶à¤¾à¤¦à¥ à¤¯à¤¾ à¤à¤¾à¤¸ à¤®à¥à¤à¥à¤ à¤ªà¤° à¤à¤ªà¤à¤¾ look à¤¹à¥ à¤à¤ªà¤à¥ personality à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ highlight à¤¹à¥à¤¤à¤¾ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¤¾ Premium Makeup à¤à¤ªà¤à¥ à¤¦à¤¿à¤¨ à¤à¥ à¤¬à¤¨à¤¾à¤à¤à¤¾ <em data-start=\"1121\" data-end=\"1148\">royal, stylish aur à¤¯à¤¾à¤¦à¤à¤¾à¤°</em>à¥¤</p>\r\n<p data-start=\"1153\" data-end=\"1223\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ special day à¤à¥ à¤¦à¥à¤ à¤à¤ <em data-start=\"1199\" data-end=\"1220\">premium royal touch</em>!</p>', 3999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('404a6ea4-b59f-4500-994d-962f7b7caa80', 'Premium Makeup (Starting Price)', 3999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('a9a75dfe-7a7d-4f07-9798-f1cd9ec3216d', 'c7843255-4208-414f-a106-0b2b620154f0', 'cf05a55d-1082-45d3-b8b9-67efad51daa8', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Mehndi Service', '<p data-start=\"76\" data-end=\"122\">ð¿ <strong data-start=\"79\" data-end=\"120\">Mehndi Service &ndash; Starting from â¹2,100</strong></p>\r\n<p data-start=\"124\" data-end=\"421\">à¤¶à¤¾à¤¦à¥ à¤à¤° à¤¤à¥à¤¯à¥à¤¹à¤¾à¤°à¥à¤ à¤à¥ <em data-start=\"145\" data-end=\"164\">à¤¸à¤¬à¤¸à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤ à¤°à¤¸à¥à¤®</em> à¤¹à¥à¤¤à¥ à¤¹à¥ à¤®à¥à¤¹à¤à¤¦à¥à¥¤ à¤¦à¥à¤²à¥à¤¹à¤¨ à¤à¥ à¤¹à¤¾à¤¥à¥à¤ à¤à¥ à¤®à¥à¤¹à¤à¤¦à¥ à¤à¤¸à¤à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤à¤° à¤à¥à¤¶à¤¿à¤¯à¥à¤ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ symbol à¤®à¤¾à¤¨à¥ à¤à¤¾à¤¤à¥ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ Mehndi Service Package à¤à¤ªà¤à¥ à¤¹à¤¾à¤¥à¥à¤-à¤ªà¥à¤°à¥à¤ à¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"333\" data-end=\"372\">à¤¸à¥à¤à¤¦à¤°, à¤à¤à¤°à¥à¤·à¤ aur traditional designs</em>, à¤à¥ à¤à¤ªà¤à¥ shaadi ke look ko à¤à¤° à¤­à¥ à¤à¤¾à¤¸ à¤¬à¤¨à¤¾ à¤¦à¥à¤à¤¾à¥¤</p>\r\n<p data-start=\"423\" data-end=\"456\">â¨ <strong data-start=\"425\" data-end=\"454\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"457\" data-end=\"761\">\r\n<li data-start=\"457\" data-end=\"496\">\r\n<p data-start=\"459\" data-end=\"496\">Mehndi Service à¤¸à¤¿à¤°à¥à¤« â¹2,100 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"497\" data-end=\"584\">\r\n<p data-start=\"499\" data-end=\"584\">Professional mehndi artists with multiple designs (Arabic, Rajasthani, Traditional)</p>\r\n</li>\r\n<li data-start=\"585\" data-end=\"637\">\r\n<p data-start=\"587\" data-end=\"637\">Natural mehndi &ndash; chemical free aur skin-friendly</p>\r\n</li>\r\n<li data-start=\"638\" data-end=\"709\">\r\n<p data-start=\"640\" data-end=\"709\">Bridal full-hand mehndi, guest mehndi aur customized design options</p>\r\n</li>\r\n<li data-start=\"710\" data-end=\"761\">\r\n<p data-start=\"712\" data-end=\"761\">Long-lasting, à¤à¤¾à¤¢à¤¼à¤¾ à¤°à¤à¤ aur attractive patterns</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"763\" data-end=\"813\">ð <strong data-start=\"766\" data-end=\"811\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Mehndi Services?</strong></p>\r\n<ul data-start=\"814\" data-end=\"1047\">\r\n<li data-start=\"814\" data-end=\"852\">\r\n<p data-start=\"816\" data-end=\"852\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹2,100 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"853\" data-end=\"895\">\r\n<p data-start=\"855\" data-end=\"895\">Experienced aur skilled mehndi artists</p>\r\n</li>\r\n<li data-start=\"896\" data-end=\"940\">\r\n<p data-start=\"898\" data-end=\"940\">Traditional aur modern designs available</p>\r\n</li>\r\n<li data-start=\"941\" data-end=\"991\">\r\n<p data-start=\"943\" data-end=\"991\">Skin-safe aur natural mehndi paste à¤à¤¾ à¤à¤¸à¥à¤¤à¥à¤®à¤¾à¤²</p>\r\n</li>\r\n<li data-start=\"992\" data-end=\"1047\">\r\n<p data-start=\"994\" data-end=\"1047\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1049\" data-end=\"1157\">ð à¤®à¥à¤¹à¤à¤¦à¥ à¤à¤¾ à¤°à¤à¤ à¤¸à¤¿à¤°à¥à¤« à¤¹à¤¾à¤¥à¥à¤ à¤à¥ à¤¨à¤¹à¥à¤ à¤¸à¤à¤¾à¤¤à¤¾, à¤¬à¤²à¥à¤à¤¿ à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¥à¤¶à¤¿à¤¯à¥à¤ à¤à¤° à¤¯à¤¾à¤¦à¥à¤ à¤à¥ aur à¤­à¥ à¤à¤¹à¤°à¤¾ à¤à¤° à¤¦à¥à¤¤à¤¾ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1159\" data-end=\"1250\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ke mehndi function ko à¤¦à¥à¤ <em data-start=\"1216\" data-end=\"1247\">à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤à¤° traditional touch</em>!</p>', 2100.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('a9a75dfe-7a7d-4f07-9798-f1cd9ec3216d', 'Mehndi Service (Starting Price)', 2100.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('2407731d-8646-45d3-aee2-5663f89d4105', 'a05114e2-4b9f-4192-9941-421b9707892e', 'ec63f2dd-aaeb-42c1-b995-8c6d1209eedd', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Dulha Car Decoration', '<p data-start=\"76\" data-end=\"128\">ð¸ <strong data-start=\"79\" data-end=\"126\">Dulha Car Decoration &ndash; Starting from â¹3,499</strong></p>\r\n<p data-start=\"130\" data-end=\"386\">à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤¦à¥à¤²à¥à¤¹à¥ à¤à¥ à¤à¤¾à¤¡à¤¼à¥ à¤¸à¤¿à¤°à¥à¤« à¤à¤ ride à¤¨à¤¹à¥à¤ à¤¬à¤²à¥à¤à¤¿ <em data-start=\"183\" data-end=\"209\">entry ka royal highlight</em> à¤¹à¥à¤¤à¥ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ Dulha Car Decoration Package à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"277\" data-end=\"302\">à¤¸à¤à¤¾à¤µà¤ à¤®à¥à¤ premium touch</em> &ndash; à¤«à¥à¤²à¥à¤, ribbons aur designer d&eacute;cor à¤à¥ à¤¸à¤¾à¤¥, à¤¤à¤¾à¤à¤¿ à¤à¤ªà¤à¥ baraat à¤à¥ à¤¶à¤¾à¤¨ à¤¸à¤¬à¤à¥ à¤¯à¤¾à¤¦ à¤°à¤¹à¥à¥¤</p>\r\n<p data-start=\"388\" data-end=\"421\">â¨ <strong data-start=\"390\" data-end=\"419\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"423\" data-end=\"686\">\r\n<li data-start=\"423\" data-end=\"462\">\r\n<p data-start=\"425\" data-end=\"462\">Car Decoration à¤¸à¤¿à¤°à¥à¤« â¹3,499 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"463\" data-end=\"523\">\r\n<p data-start=\"465\" data-end=\"523\">Fresh flowers, ribbons, lights aur premium d&eacute;cor options</p>\r\n</li>\r\n<li data-start=\"524\" data-end=\"586\">\r\n<p data-start=\"526\" data-end=\"586\">Customized decoration themes (royal, elegant, modern etc.)</p>\r\n</li>\r\n<li data-start=\"587\" data-end=\"631\">\r\n<p data-start=\"589\" data-end=\"631\">Well-trained decorators aur timely setup</p>\r\n</li>\r\n<li data-start=\"632\" data-end=\"686\">\r\n<p data-start=\"634\" data-end=\"686\">Budget à¤¸à¥ à¤²à¥à¤à¤° luxury à¤¹à¤° type à¤à¥ decoration à¤à¤ªà¤²à¤¬à¥à¤§</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"688\" data-end=\"752\">ð <strong data-start=\"691\" data-end=\"750\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Dulha Car Decoration Services?</strong></p>\r\n<ul data-start=\"754\" data-end=\"948\">\r\n<li data-start=\"754\" data-end=\"792\">\r\n<p data-start=\"756\" data-end=\"792\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹3,499 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"793\" data-end=\"839\">\r\n<p data-start=\"795\" data-end=\"839\">Multiple decoration themes &amp; customization</p>\r\n</li>\r\n<li data-start=\"840\" data-end=\"892\">\r\n<p data-start=\"842\" data-end=\"892\">Premium quality flowers aur material à¤à¤¾ à¤à¤¸à¥à¤¤à¥à¤®à¤¾à¤²</p>\r\n</li>\r\n<li data-start=\"893\" data-end=\"948\">\r\n<p data-start=\"895\" data-end=\"948\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"950\" data-end=\"1068\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¾ à¤¹à¤° moment à¤à¤¾à¤¸ à¤¹à¥à¤¤à¤¾ à¤¹à¥, à¤à¤° dulha car decoration à¤à¤¸ moment à¤à¥ à¤à¤° à¤­à¥ grand aur memorable à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¤¾ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1070\" data-end=\"1146\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ dulha car à¤à¥ à¤¦à¥à¤ royal aur stylish à¤¸à¤à¤¾à¤µà¤ à¤à¤¾ touch!</p>', 3499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('2407731d-8646-45d3-aee2-5663f89d4105', 'Normal à¤¸à¤à¤¾à¤µà¤', 3499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('2407731d-8646-45d3-aee2-5663f89d4105', 'Heavy Decoration', 5499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('2407731d-8646-45d3-aee2-5663f89d4105', 'Designer Decoration', 7599.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('2407731d-8646-45d3-aee2-5663f89d4105', 'Royal Decoration', 14999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('36aada76-c7a5-4e8f-999b-2b68fc97eb39', 'a05114e2-4b9f-4192-9941-421b9707892e', '8783e0ee-ed96-4fde-8ed8-e6c2818e577e', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Stage Decoration', '<p data-start=\"63\" data-end=\"111\">ð <strong data-start=\"66\" data-end=\"109\">Stage Decoration &ndash; Starting from â¹9,999</strong></p>\r\n<p data-start=\"113\" data-end=\"444\">à¤¶à¤¾à¤¦à¥ à¤®à¥à¤ à¤¸à¤¬à¤¸à¥ à¤à¥à¤¯à¤¾à¤¦à¤¾ à¤¨à¤à¤¼à¤°à¥à¤ à¤à¤¿à¤¸ à¤à¤à¤¹ à¤ªà¤° à¤à¤¿à¤à¥ à¤°à¤¹à¤¤à¥ à¤¹à¥à¤, à¤µà¥ à¤¹à¥ <em data-start=\"173\" data-end=\"188\">wedding stage</em>à¥¤ à¤¯à¤¹à¤¾à¤ à¤¦à¥à¤²à¥à¤¹à¤¾&ndash;à¤¦à¥à¤²à¥à¤¹à¤¨ à¤¬à¥à¤ à¤¤à¥ à¤¹à¥à¤ à¤à¤° à¤¯à¤¹à¥à¤ à¤ªà¤° à¤¸à¤¬à¤¸à¥ à¤à¥à¤¯à¤¾à¤¦à¤¾ à¤«à¥à¤à¥à¤¶à¥à¤ à¤­à¥ à¤¹à¥à¤¤à¤¾ à¤¹à¥à¥¤ à¤à¤à¤° stage à¤¸à¤à¤¾à¤µà¤ grand à¤à¤° royal à¤¹à¥ à¤¤à¥ à¤ªà¥à¤°à¥ shaadi à¤à¤¾ level à¤¹à¥ à¤à¤²à¤ à¤¦à¤¿à¤à¤¤à¤¾ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ Stage Decoration Package à¤à¤ªà¤à¥ wedding stage à¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"408\" data-end=\"441\">premium, à¤à¤à¤°à¥à¤·à¤ aur à¤¯à¤¾à¤¦à¤à¤¾à¤° look</em>à¥¤</p>\r\n<p data-start=\"446\" data-end=\"479\">â¨ <strong data-start=\"448\" data-end=\"477\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"480\" data-end=\"755\">\r\n<li data-start=\"480\" data-end=\"521\">\r\n<p data-start=\"482\" data-end=\"521\">Stage Decoration à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"522\" data-end=\"577\">\r\n<p data-start=\"524\" data-end=\"577\">Fresh flowers, designer backdrop aur lighting setup</p>\r\n</li>\r\n<li data-start=\"578\" data-end=\"640\">\r\n<p data-start=\"580\" data-end=\"640\">Multiple themes &ndash; Traditional, Modern, Bollywood aur Royal</p>\r\n</li>\r\n<li data-start=\"641\" data-end=\"700\">\r\n<p data-start=\"643\" data-end=\"700\">Sofa / chair arrangement with premium draping aur à¤¸à¤à¤¾à¤µà¤</p>\r\n</li>\r\n<li data-start=\"701\" data-end=\"755\">\r\n<p data-start=\"703\" data-end=\"755\">Professional decorators aur timely setup à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"757\" data-end=\"817\">ð <strong data-start=\"760\" data-end=\"815\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Stage Decoration Services?</strong></p>\r\n<ul data-start=\"818\" data-end=\"1020\">\r\n<li data-start=\"818\" data-end=\"856\">\r\n<p data-start=\"820\" data-end=\"856\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"857\" data-end=\"909\">\r\n<p data-start=\"859\" data-end=\"909\">Fresh flowers aur premium quality d&eacute;cor material</p>\r\n</li>\r\n<li data-start=\"910\" data-end=\"964\">\r\n<p data-start=\"912\" data-end=\"964\">Customized stage themes (simple à¤¸à¥ à¤²à¥à¤à¤° luxury à¤¤à¤)</p>\r\n</li>\r\n<li data-start=\"965\" data-end=\"1020\">\r\n<p data-start=\"967\" data-end=\"1020\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1022\" data-end=\"1191\">ð Wedding stage à¤¹à¥ à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¤¾ <em data-start=\"1055\" data-end=\"1077\">center of attraction</em> à¤¹à¥à¤¤à¤¾ à¤¹à¥ &ndash; à¤à¤° à¤¹à¤®à¤¾à¤°à¥ à¤¸à¤à¤¾à¤µà¤ à¤à¤¸à¤à¥ royal aur stylish à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥, à¤¤à¤¾à¤à¤¿ à¤¹à¤° guest impressed à¤¹à¥ à¤à¤° à¤¹à¤° photo perfect à¤à¤à¥¤</p>\r\n<p data-start=\"1193\" data-end=\"1264\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ stage à¤à¥ à¤¦à¥à¤ à¤à¤ grand aur royal look!</p>', 10999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('36aada76-c7a5-4e8f-999b-2b68fc97eb39', 'Lite/Normal Decoration', 10999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('36aada76-c7a5-4e8f-999b-2b68fc97eb39', 'Heavy Decoration', 21999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('36aada76-c7a5-4e8f-999b-2b68fc97eb39', 'Designer Decoration', 34999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('36aada76-c7a5-4e8f-999b-2b68fc97eb39', 'Royal Decoration', 59999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('f50c3aff-fd19-4ce4-99ce-4433671093b0', '17082033-bfd1-49e4-99bf-db05b821bea9', '1e2b312b-5086-40e1-95bf-e640cf699017', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Dulha Car', '<p data-start=\"220\" data-end=\"279\">ð <strong data-start=\"223\" data-end=\"277\">Dulha Car &ndash; Starting from â¹3,299 (Half Day + Fuel)</strong></p>\r\n<p data-start=\"281\" data-end=\"606\">à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤¦à¥à¤²à¥à¤¹à¥ à¤à¥ entry à¤¹à¤®à¥à¤¶à¤¾ royal aur stylish à¤¹à¥à¤¨à¥ à¤à¤¾à¤¹à¤¿à¤à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"361\" data-end=\"382\">Dulha Car Package</strong> à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ luxury cars aur premium rides à¤à¤¾ option, à¤à¤¿à¤¸à¤¸à¥ à¤à¤ªà¤à¥ shaadi à¤à¥ shaan aur bhi à¤¬à¤¢à¤¼ à¤à¤¾à¤à¥¤ à¤¹à¤®à¤¾à¤°à¥ cars well-maintained, decorated aur comfortable à¤¹à¥à¤¤à¥ à¤¹à¥à¤, à¤¤à¤¾à¤à¤¿ à¤à¤ª apni baraat ki entry ekà¤¦à¤® royal style me kar sakenà¥¤</p>\r\n<p data-start=\"608\" data-end=\"641\">â¨ <strong data-start=\"610\" data-end=\"639\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"642\" data-end=\"927\">\r\n<li data-start=\"642\" data-end=\"697\">\r\n<p data-start=\"644\" data-end=\"697\">Dulha car booking à¤¸à¤¿à¤°à¥à¤« â¹3,299 (Half Day + Fuel) à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"698\" data-end=\"769\">\r\n<p data-start=\"700\" data-end=\"769\">Wide range of cars &ndash; Scorpio, Bulero, Sedan, SUV aur luxury options</p>\r\n</li>\r\n<li data-start=\"770\" data-end=\"809\">\r\n<p data-start=\"772\" data-end=\"809\">Well-maintained aur à¤¸à¤¾à¤«-à¤¸à¥à¤¥à¤°à¥ à¤à¤¾à¤¡à¤¼à¥</p>\r\n</li>\r\n<li data-start=\"810\" data-end=\"872\">\r\n<p data-start=\"812\" data-end=\"872\">à¤¸à¤à¤¾à¤µà¤ (basic decoration included, customization available)</p>\r\n</li>\r\n<li data-start=\"873\" data-end=\"927\">\r\n<p data-start=\"875\" data-end=\"927\">Professional driver aur time à¤ªà¤° delivery à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"929\" data-end=\"1101\">à¤à¤¾à¤¹à¥ baraat ki dhamakedaar entry à¤¹à¥, mandap à¤¤à¤ à¤à¤¾ royal ride ya photo-shoot ke liye stylish car shots &ndash; à¤¹à¤®à¤¾à¤°à¥ dulha gadi services à¤¹à¤° moment ko aur bhi grand bana à¤¦à¥à¤¤à¥ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1103\" data-end=\"1156\">ð <strong data-start=\"1106\" data-end=\"1154\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Dulha Car Services?</strong></p>\r\n<ul data-start=\"1157\" data-end=\"1343\">\r\n<li data-start=\"1157\" data-end=\"1195\">\r\n<p data-start=\"1159\" data-end=\"1195\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹3,299 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1196\" data-end=\"1247\">\r\n<p data-start=\"1198\" data-end=\"1247\">Multiple car options (Budget se à¤²à¥à¤à¤° Luxury à¤¤à¤)</p>\r\n</li>\r\n<li data-start=\"1248\" data-end=\"1286\">\r\n<p data-start=\"1250\" data-end=\"1286\">Well-maintained aur decorated cars</p>\r\n</li>\r\n<li data-start=\"1287\" data-end=\"1343\">\r\n<p data-start=\"1289\" data-end=\"1343\">Timely delivery aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1345\" data-end=\"1454\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration à¤¹à¥, à¤à¤° dulha ki entry uska à¤¸à¤¬à¤¸à¥ royal highlight à¤¹à¥à¤¨à¤¾ à¤à¤¾à¤¹à¤¿à¤à¥¤</p>\r\n<p data-start=\"1456\" data-end=\"1521\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ki baraat à¤à¥ ek royal touch à¤¦à¥à¤à¥¤</p>', 3499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('f50c3aff-fd19-4ce4-99ce-4433671093b0', 'Dulha-Car-(half-day-+-fuel)', 3499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('8b5f1dea-792b-46be-b782-1349a9a34539', '84ee0286-1a68-448b-87c0-3a57b6361f28', '2d810793-8b5d-4df6-aa53-081e085b546c', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Candid', '<h3 data-start=\"156\" data-end=\"204\">ð¸ Candid Shoot &ndash; Starting from â¹7,999/day</h3>\r\n<p data-start=\"206\" data-end=\"592\">à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤¸à¤²à¥ à¤®à¤à¤¼à¥ à¤à¤° à¤à¤¸à¤²à¥ emotions candid shots à¤®à¥à¤ à¤¹à¥ à¤à¤¿à¤ªà¥ à¤¹à¥à¤¤à¥ à¤¹à¥à¤à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"292\" data-end=\"316\">Candid Shoot Package</strong> à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤¨ à¤ªà¤²à¥à¤ à¤à¥ capture à¤à¤°à¤¤à¤¾ à¤¹à¥ à¤à¥ à¤¸à¤¬à¤¸à¥ natural aur real hote hain &ndash; à¤¬à¤¿à¤¨à¤¾ pose, à¤¬à¤¿à¤¨à¤¾ retake, à¤¬à¤¸ asli khushi aur asli expressionsà¥¤ à¤¹à¤®à¤¾à¤°à¥ à¤ªà¥à¤°à¥à¤«à¥à¤¶à¤¨à¤² à¤à¥à¤® creative angles aur high-quality à¤à¥à¤®à¤°à¥à¤ à¤à¥ à¤¸à¤¾à¤¥ à¤¹à¤° candid moment à¤à¥ à¤à¤¸ à¤¤à¤°à¤¹ à¤à¥à¤¦ à¤à¤°à¤¤à¥ à¤¹à¥ à¤à¤¿ à¤µà¥ lifetime à¤à¥ à¤¯à¤¾à¤¦ à¤¬à¤¨ à¤à¤¾à¤à¥¤</p>\r\n<p data-start=\"594\" data-end=\"623\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"625\" data-end=\"982\">\r\n<li data-start=\"625\" data-end=\"677\">\r\n<p data-start=\"627\" data-end=\"677\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ candid coverage (â¹7,999/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"678\" data-end=\"731\">\r\n<p data-start=\"680\" data-end=\"731\">Experienced candid photographers à¤à¥ dedicated à¤à¥à¤®</p>\r\n</li>\r\n<li data-start=\"732\" data-end=\"799\">\r\n<p data-start=\"734\" data-end=\"799\">Natural lighting aur creative angles ke à¤¸à¤¾à¤¥ premium photography</p>\r\n</li>\r\n<li data-start=\"800\" data-end=\"868\">\r\n<p data-start=\"802\" data-end=\"868\">Bride aur groom ke candid emotions aur family ke special moments</p>\r\n</li>\r\n<li data-start=\"869\" data-end=\"930\">\r\n<p data-start=\"871\" data-end=\"930\">High-resolution edited digital album + easy sharing files</p>\r\n</li>\r\n<li data-start=\"931\" data-end=\"982\">\r\n<p data-start=\"933\" data-end=\"982\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization aur add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"984\" data-end=\"1155\">à¤à¤¾à¤¹à¥ doston ki masti ho, bride-groom ki candid smile, family ke emotions ya dance floor ki energy &ndash; à¤¹à¤®à¤¾à¤°à¥ team ensure karti hai ki à¤¹à¤° shot ekà¤¦à¤® natural aur memorable hoà¥¤</p>\r\n<p data-start=\"1157\" data-end=\"1209\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Candid Shoot Services?</p>\r\n<ul data-start=\"1211\" data-end=\"1402\">\r\n<li data-start=\"1211\" data-end=\"1253\">\r\n<p data-start=\"1213\" data-end=\"1253\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹7,999/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1254\" data-end=\"1306\">\r\n<p data-start=\"1256\" data-end=\"1306\">100+ successful candid wedding projects à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1307\" data-end=\"1354\">\r\n<p data-start=\"1309\" data-end=\"1354\">Natural storytelling + premium candid style</p>\r\n</li>\r\n<li data-start=\"1355\" data-end=\"1402\">\r\n<p data-start=\"1357\" data-end=\"1402\">Timely delivery aur guaranteed satisfaction</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1404\" data-end=\"1499\">ð à¤à¤ªà¤à¥ shaadi ek celebration hai, aur candid shots us celebration ki asli kahani sunà¤¾à¤¤à¥ à¤¹à¥à¤à¥¤</p>\r\n<p data-start=\"1501\" data-end=\"1586\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ aur apni wedding ko candid memories ke saath hamesha yaadà¤à¤¾à¤° à¤¬à¤¨à¤¾à¤à¤!</p>', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('8b5f1dea-792b-46be-b782-1349a9a34539', 'Candid-(Price-starts-from)', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('cccec0a8-e5ec-448b-9ab3-46587ae3ac89', '84ee0286-1a68-448b-87c0-3a57b6361f28', '5e5d4604-f6f9-4709-8eca-05beb11de0c0', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Cinematic', '<h3 data-start=\"157\" data-end=\"208\">ð¬ Cinematic Shoot &ndash; Starting from â¹9,999/day</h3>\r\n<p data-start=\"210\" data-end=\"658\">à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤¸à¤¿à¤°à¥à¤« à¤à¤ celebration à¤¨à¤¹à¥à¤ à¤¬à¤²à¥à¤à¤¿ à¤à¤ <strong data-start=\"255\" data-end=\"270\">grand story</strong> à¤¹à¥, à¤à¤¿à¤¸à¥ à¤¹à¤® cinematic style à¤®à¥à¤ capture à¤à¤°à¤¤à¥ à¤¹à¥à¤à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"337\" data-end=\"364\">Cinematic Shoot Package</strong> à¤à¤ªà¤à¥ à¤¹à¤° à¤ªà¤² à¤à¥ film-like experience deta hai &ndash; jisme slow-motion shots, creative angles aur artistic editing se à¤à¤ªà¤à¥ shaadi ek <strong data-start=\"491\" data-end=\"512\">blockbuster movie</strong> ban à¤à¤¾à¤¤à¥ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¥ à¤ªà¥à¤°à¥à¤«à¥à¤¶à¤¨à¤² à¤à¥à¤® latest cinematic cameras aur advanced equipment ke saath à¤à¤¾à¤® à¤à¤°à¤¤à¥ à¤¹à¥ à¤¤à¤¾à¤à¤¿ à¤¹à¤° frame ekà¤¦à¤® royal aur elegant à¤²à¤à¥à¥¤</p>\r\n<p data-start=\"660\" data-end=\"689\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"691\" data-end=\"1044\">\r\n<li data-start=\"691\" data-end=\"746\">\r\n<p data-start=\"693\" data-end=\"746\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ cinematic coverage (â¹9,999/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"747\" data-end=\"805\">\r\n<p data-start=\"749\" data-end=\"805\">Professional cinematic videographers à¤à¥ dedicated team</p>\r\n</li>\r\n<li data-start=\"806\" data-end=\"873\">\r\n<p data-start=\"808\" data-end=\"873\">Creative shots with slow-motion, transitions &amp; cinematic frames</p>\r\n</li>\r\n<li data-start=\"874\" data-end=\"930\">\r\n<p data-start=\"876\" data-end=\"930\">Drone shots* à¤à¤° multi-camera setup for grand visuals</p>\r\n</li>\r\n<li data-start=\"931\" data-end=\"992\">\r\n<p data-start=\"933\" data-end=\"992\">Professionally edited cinematic wedding film + highlights</p>\r\n</li>\r\n<li data-start=\"993\" data-end=\"1044\">\r\n<p data-start=\"995\" data-end=\"1044\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization aur add-ons ki à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1046\" data-end=\"1242\">à¤à¤¾à¤¹à¥ varmala à¤à¥ entry ho, bride-groom ke candid moments, sangeet ki masti ya bidaai ka emotional scene &ndash; à¤¹à¤®à¤¾à¤°à¥ à¤à¥à¤® à¤¹à¤° moment à¤à¥ is tarah shoot karti hai ki à¤à¤ªà¤à¥ shaadi ek <strong data-start=\"1217\" data-end=\"1235\">dreamlike film</strong> à¤²à¤à¥à¥¤</p>\r\n<p data-start=\"1244\" data-end=\"1299\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Cinematic Shoot Services?</p>\r\n<ul data-start=\"1301\" data-end=\"1511\">\r\n<li data-start=\"1301\" data-end=\"1351\">\r\n<p data-start=\"1303\" data-end=\"1351\">Affordable cinematic shoot à¤¸à¤¿à¤°à¥à¤« â¹9,999/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1352\" data-end=\"1404\">\r\n<p data-start=\"1354\" data-end=\"1404\">100+ successful cinematic wedding films à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1405\" data-end=\"1456\">\r\n<p data-start=\"1407\" data-end=\"1456\">Creative storytelling + premium cinematic touch</p>\r\n</li>\r\n<li data-start=\"1457\" data-end=\"1511\">\r\n<p data-start=\"1459\" data-end=\"1511\">Timely delivery aur guaranteed client satisfaction</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1513\" data-end=\"1647\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration à¤¹à¥, aur hamari responsibility hai ki hum usse ek <strong data-start=\"1610\" data-end=\"1635\">cinematic masterpiece</strong> banayeinà¥¤</p>\r\n<p data-start=\"1649\" data-end=\"1732\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ aur apni wedding ko ek blockbuster cinematic experience bana à¤²à¥à¤!</p>', 15999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('cccec0a8-e5ec-448b-9ab3-46587ae3ac89', 'Cinematic-shoot-(Pricing-starts-from)', 15999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('435f476b-0d39-46e1-88ed-0ac6d5201002', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'd425cf80-3654-4fc4-a0aa-afea017cdc2c', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Videography', '<h3 data-start=\"146\" data-end=\"201\">ð¥ Wedding Videography &ndash; Starting from â¹4,999/day</h3>\r\n<p data-start=\"203\" data-end=\"501\">à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¹à¤° à¤à¤¾à¤¸ à¤ªà¤² à¤à¥ à¤¸à¤¿à¤°à¥à¤« à¤¯à¤¾à¤¦à¥à¤ à¤®à¥à¤ à¤¨à¤¹à¥à¤ à¤¬à¤²à¥à¤à¤¿ à¤à¤ <strong data-start=\"259\" data-end=\"277\">cinematic film</strong> à¤à¥ à¤¤à¤°à¤¹ à¤¬à¤¾à¤°-à¤¬à¤¾à¤° à¤à¥à¤¨à¥ à¤à¤¾ à¤®à¥à¤à¤¾ à¤®à¤¿à¤²à¤¤à¤¾ à¤¹à¥ Vivah Bazaar à¤à¥ Wedding Videography Package à¤à¥ à¤¸à¤¾à¤¥à¥¤ à¤¹à¤®à¤¾à¤°à¥ à¤ªà¥à¤°à¥à¤«à¥à¤¶à¤¨à¤² à¤à¥à¤® à¤à¤ªà¤à¥ à¤¹à¤° emotion, à¤¹à¤° ritual à¤à¤° à¤¹à¤° celebration à¤à¥ high-quality à¤à¥à¤®à¤°à¥à¤ à¤à¤° latest technology à¤à¥ à¤¸à¤¾à¤¥ capture à¤à¤°à¤¤à¥ à¤¹à¥à¥¤</p>\r\n<p data-start=\"503\" data-end=\"532\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"534\" data-end=\"867\">\r\n<li data-start=\"534\" data-end=\"579\">\r\n<p data-start=\"536\" data-end=\"579\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ coverage (â¹4,999/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"580\" data-end=\"634\">\r\n<p data-start=\"582\" data-end=\"634\">Experienced wedding videographers à¤à¥ dedicated à¤à¥à¤®</p>\r\n</li>\r\n<li data-start=\"635\" data-end=\"695\">\r\n<p data-start=\"637\" data-end=\"695\">Cinematic &amp; Traditional videography à¤¦à¥à¤¨à¥à¤ à¤à¤¾ perfect mix</p>\r\n</li>\r\n<li data-start=\"696\" data-end=\"759\">\r\n<p data-start=\"698\" data-end=\"759\">Drone shots* à¤à¤° crystal-clear sound à¤à¥ à¤¸à¤¾à¤¥ premium shooting</p>\r\n</li>\r\n<li data-start=\"760\" data-end=\"816\">\r\n<p data-start=\"762\" data-end=\"816\">Professionally edited highlights + full wedding film</p>\r\n</li>\r\n<li data-start=\"817\" data-end=\"867\">\r\n<p data-start=\"819\" data-end=\"867\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization à¤à¤° add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"869\" data-end=\"1066\">à¤à¤¾à¤¹à¥ varmala à¤à¥ masti à¤¹à¥, mehendi à¤à¥ à¤°à¤à¤à¥à¤¨ à¤¶à¤¾à¤®, doston ke dance moves à¤¯à¤¾ bidaai à¤à¤¾ emotional moment &ndash; à¤¹à¤®à¤¾à¤°à¥ à¤à¥à¤® à¤¹à¤° scene à¤à¥ à¤à¤¸ à¤¤à¤°à¤¹ record à¤à¤°à¤¤à¥ à¤¹à¥ à¤à¤¿ à¤à¤ªà¤à¥ shaadi ek <strong data-start=\"1033\" data-end=\"1054\">blockbuster movie</strong> à¤à¥à¤¸à¥ à¤²à¤à¥à¥¤</p>\r\n<p data-start=\"1068\" data-end=\"1119\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Videography Services?</p>\r\n<ul data-start=\"1121\" data-end=\"1333\">\r\n<li data-start=\"1121\" data-end=\"1163\">\r\n<p data-start=\"1123\" data-end=\"1163\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹4,999/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1164\" data-end=\"1221\">\r\n<p data-start=\"1166\" data-end=\"1221\">100+ successful wedding videography projects à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1222\" data-end=\"1277\">\r\n<p data-start=\"1224\" data-end=\"1277\">Creative cinematic storytelling + traditional touch</p>\r\n</li>\r\n<li data-start=\"1278\" data-end=\"1333\">\r\n<p data-start=\"1280\" data-end=\"1333\">Timely delivery à¤à¤° client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1335\" data-end=\"1470\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ responsibility à¤¹à¥ à¤à¤¿ à¤¹à¤® à¤¹à¤° à¤ªà¤² à¤à¥ ek beautiful cinematic story à¤®à¥à¤ à¤¬à¤¦à¤²à¥à¤à¥¤</p>\r\n<p data-start=\"1472\" data-end=\"1537\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ wedding ko ek blockbuster film à¤¬à¤¨à¤¾ à¤²à¥à¤!</p>', 6999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('435f476b-0d39-46e1-88ed-0ac6d5201002', 'Videography', 6999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('bbcd7a6e-35c9-43b6-bf0e-2351fc96cdb7', '84ee0286-1a68-448b-87c0-3a57b6361f28', '4be219eb-7f3e-485a-8674-037e0be9722c', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Still Photography', '<h3 data-start=\"241\" data-end=\"294\">ð¸ Still Photography &ndash; Starting from â¹7,499/day</h3>\r\n<p data-start=\"296\" data-end=\"618\">à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤¾à¤¸ à¤²à¤®à¥à¤¹à¥ à¤¹à¤®à¥à¤¶à¤¾ à¤à¥ à¤²à¤¿à¤ à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤°à¤¹à¤¨à¥ à¤à¤¾à¤¹à¤¿à¤à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"367\" data-end=\"396\">Still Photography Package</strong> à¤à¤ªà¤à¥ à¤¹à¤° emotion, à¤¹à¤° à¤®à¥à¤¸à¥à¤à¤¾à¤¨ à¤à¤° à¤¹à¤° à¤à¤¾à¤¸ à¤ªà¤² à¤à¥ à¤¬à¤¡à¤¼à¥ à¤¹à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤¸à¥ à¤à¥à¤¦ à¤à¤°à¤¤à¤¾ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¥ à¤ªà¥à¤°à¥à¤«à¥à¤¶à¤¨à¤² à¤à¥à¤® high-quality à¤à¥à¤®à¤°à¥à¤ à¤à¤° latest equipment à¤à¥ à¤¸à¤¾à¤¥ à¤¶à¥à¤ à¤à¤°à¤¤à¥ à¤¹à¥ à¤¤à¤¾à¤à¤¿ à¤à¤ªà¤à¥ à¤¹à¤° à¤¤à¤¸à¥à¤µà¥à¤° cinematic look à¤à¤° premium quality à¤®à¥à¤ à¤®à¤¿à¤²à¥à¥¤</p>\r\n<p data-start=\"620\" data-end=\"649\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"650\" data-end=\"984\">\r\n<li data-start=\"650\" data-end=\"695\">\r\n<p data-start=\"652\" data-end=\"695\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ coverage (â¹7,499/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"696\" data-end=\"750\">\r\n<p data-start=\"698\" data-end=\"750\">Experienced wedding photographers à¤à¥ dedicated à¤à¥à¤®</p>\r\n</li>\r\n<li data-start=\"751\" data-end=\"808\">\r\n<p data-start=\"753\" data-end=\"808\">Candid &amp; Traditional Photography à¤¦à¥à¤¨à¥à¤ à¤à¤¾ perfect mix</p>\r\n</li>\r\n<li data-start=\"809\" data-end=\"873\">\r\n<p data-start=\"811\" data-end=\"873\">Natural light à¤à¤° creative angles à¤à¥ à¤¸à¤¾à¤¥ professional editing</p>\r\n</li>\r\n<li data-start=\"874\" data-end=\"933\">\r\n<p data-start=\"876\" data-end=\"933\">High-resolution digital album à¤à¤° sharing-friendly files</p>\r\n</li>\r\n<li data-start=\"934\" data-end=\"984\">\r\n<p data-start=\"936\" data-end=\"984\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization à¤à¤° add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"986\" data-end=\"1202\">à¤à¤¾à¤¹à¥ à¤¶à¤¾à¤¦à¥ à¤à¤¾ mandap à¤¹à¥, varmala ceremony, mehendi à¤à¥ à¤°à¤à¤à¥à¤¨ à¤ªà¤² à¤¹à¥à¤ à¤¯à¤¾ à¤¦à¥à¤²à¥à¤¹à¤¾-à¤¦à¥à¤²à¥à¤¹à¤¨ à¤à¥ candid à¤®à¥à¤¸à¥à¤à¤¾à¤¨ &ndash; à¤¹à¤®à¤¾à¤°à¥ à¤à¥à¤® à¤¹à¤° emotion à¤à¥ à¤à¤¸ à¤¤à¤°à¤¹ capture à¤à¤°à¤¤à¥ à¤¹à¥ à¤à¤¿ à¤µà¥ à¤¤à¤¸à¥à¤µà¥à¤°à¥à¤ à¤¸à¤¿à¤°à¥à¤« à¤«à¥à¤à¥ à¤¨ à¤°à¤¹à¤à¤° <strong data-start=\"1169\" data-end=\"1191\">life-time memories</strong> à¤¬à¤¨ à¤à¤¾à¤à¤à¥¤</p>\r\n<p data-start=\"1204\" data-end=\"1255\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Photography Services?</p>\r\n<ul data-start=\"1256\" data-end=\"1446\">\r\n<li data-start=\"1256\" data-end=\"1298\">\r\n<p data-start=\"1258\" data-end=\"1298\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹7,499/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1299\" data-end=\"1348\">\r\n<p data-start=\"1301\" data-end=\"1348\">100+ à¤¸à¤«à¤² à¤¶à¤¾à¤¦à¥ à¤«à¥à¤à¥à¤à¥à¤°à¤¾à¤«à¥ à¤ªà¥à¤°à¥à¤à¥à¤à¥à¤à¥à¤¸ à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1349\" data-end=\"1390\">\r\n<p data-start=\"1351\" data-end=\"1390\">Creative approach + Traditional touch</p>\r\n</li>\r\n<li data-start=\"1391\" data-end=\"1446\">\r\n<p data-start=\"1393\" data-end=\"1446\">Timely delivery à¤à¤° client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1448\" data-end=\"1578\">ð à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ responsibility à¤¹à¥ à¤à¤¿ à¤¹à¤® à¤à¤¨ à¤ªà¤²à¥à¤ à¤à¥ à¤¹à¤®à¥à¤¶à¤¾ à¤à¥ à¤²à¤¿à¤ à¤à¤ªà¤à¥ à¤²à¤¿à¤ à¤¸à¤à¤à¥à¤à¤° à¤°à¤à¥à¤à¥¤</p>\r\n<p data-start=\"1580\" data-end=\"1653\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ wedding memories à¤à¥ à¤à¤ à¤à¥à¤¬à¤¸à¥à¤°à¤¤ à¤à¤¹à¤¾à¤¨à¥ à¤®à¥à¤ à¤¬à¤¦à¤²à¥à¤à¥¤</p>', 8999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('bbcd7a6e-35c9-43b6-bf0e-2351fc96cdb7', 'Still-Photography-(Starting-price)', 8999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('aa8664a8-8eaa-4d54-a8d3-85d6c9dcfae3', 'c7843255-4208-414f-a106-0b2b620154f0', '2c17a80f-623e-4392-8d7b-65088c07bbbe', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'HD Finish Makeup', '<p data-start=\"71\" data-end=\"126\">â¨ <strong data-start=\"73\" data-end=\"124\">HD Finish Makeup Service &ndash; Starting from â¹2,199</strong></p>\r\n<p data-start=\"128\" data-end=\"372\">à¤¶à¤¾à¤¦à¥ à¤¯à¤¾ à¤à¤¿à¤¸à¥ à¤­à¥ à¤à¤¾à¤¸ à¤®à¥à¤à¥ à¤ªà¤° à¤¹à¤° à¤²à¤¡à¤¼à¤à¥ à¤à¤¾à¤¹à¤¤à¥ à¤¹à¥ à¤à¤¿ à¤à¤¸à¤à¤¾ look <em data-start=\"187\" data-end=\"209\">perfect aur flawless</em> à¤¦à¤¿à¤à¥à¥¤ Vivah Bazaar à¤à¤¾ HD Finish Makeup Package à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"270\" data-end=\"309\">smooth, natural aur long-lasting look</em> &ndash; à¤à¤¿à¤¸à¤¸à¥ à¤à¤ªà¤à¥ skin à¤à¤®à¤à¥ à¤à¤° photos à¤®à¥à¤ à¤à¤ª à¤à¤° à¤­à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤ à¤¦à¤¿à¤à¥à¤à¥¤</p>\r\n<p data-start=\"374\" data-end=\"407\">â¨ <strong data-start=\"376\" data-end=\"405\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"408\" data-end=\"671\">\r\n<li data-start=\"408\" data-end=\"449\">\r\n<p data-start=\"410\" data-end=\"449\">HD Finish Makeup à¤¸à¤¿à¤°à¥à¤« â¹2,199 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"450\" data-end=\"509\">\r\n<p data-start=\"452\" data-end=\"509\">Professional makeup artist aur high-quality HD products</p>\r\n</li>\r\n<li data-start=\"510\" data-end=\"556\">\r\n<p data-start=\"512\" data-end=\"556\">Smooth aur natural look with full coverage</p>\r\n</li>\r\n<li data-start=\"557\" data-end=\"609\">\r\n<p data-start=\"559\" data-end=\"609\">Hairstyling aur basic accessories setup included</p>\r\n</li>\r\n<li data-start=\"610\" data-end=\"671\">\r\n<p data-start=\"612\" data-end=\"671\">Long-lasting finish (à¤ªà¥à¤°à¥ function à¤®à¥à¤ makeup à¤à¤¿à¤à¤¾ à¤°à¤¹à¥à¤à¤¾)</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"673\" data-end=\"733\">ð <strong data-start=\"676\" data-end=\"731\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar HD Finish Makeup Services?</strong></p>\r\n<ul data-start=\"734\" data-end=\"926\">\r\n<li data-start=\"734\" data-end=\"772\">\r\n<p data-start=\"736\" data-end=\"772\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹2,199 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"773\" data-end=\"820\">\r\n<p data-start=\"775\" data-end=\"820\">Experienced aur professional makeup artists</p>\r\n</li>\r\n<li data-start=\"821\" data-end=\"870\">\r\n<p data-start=\"823\" data-end=\"870\">HD products se flawless aur glowing skin look</p>\r\n</li>\r\n<li data-start=\"871\" data-end=\"926\">\r\n<p data-start=\"873\" data-end=\"926\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"928\" data-end=\"1070\">ð à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤¯à¤¾ à¤à¤¾à¤¸ à¤®à¥à¤à¥ à¤à¥ à¤¹à¤° photo <em data-start=\"965\" data-end=\"984\">à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤­à¤° à¤¯à¤¾à¤¦à¤à¤¾à¤°</em> à¤¹à¥à¤¤à¥ à¤¹à¥à¥¤ HD Finish Makeup à¤à¤ªà¤à¥ look ko à¤¬à¤¨à¤¾ à¤¦à¥à¤à¤¾ aur à¤­à¥ elegant aur picture-perfectà¥¤</p>\r\n<p data-start=\"1072\" data-end=\"1136\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ special day à¤à¥ à¤¦à¥à¤ <em data-start=\"1115\" data-end=\"1133\">HD flawless look</em>!</p>', 2199.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('aa8664a8-8eaa-4d54-a8d3-85d6c9dcfae3', 'HD Finish Makeup', 2199.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('f77f35cd-2fcd-4f33-bd3d-2d9fd388f1b4', '84ee0286-1a68-448b-87c0-3a57b6361f28', '887adb37-ca35-411e-a089-b6477c5867f4', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Pre Wedding Shoot', '<h3 data-start=\"154\" data-end=\"204\">ð Pre Wedding Shoot &ndash; Starting from â¹44,999</h3>\r\n<p data-start=\"206\" data-end=\"659\">Shaadi se pehle ka safar bhi utna hi khaas hota hai jitna shaadi ka din. Vivah Bazaar ka <strong data-start=\"295\" data-end=\"324\">Pre Wedding Shoot Package</strong> aapke love story ko ek cinematic aur romantic style me capture karta hai. Beautiful locations, stylish poses aur candid emotions ke saath hum aapke relationship ki journey ko ek timeless memory bana dete hain. à¤¹à¤®à¤¾à¤°à¥ professional team latest cameras aur creative concepts ke saath aapke pre-wedding shoot ko ekà¤¦à¤® filmy look deti haià¥¤</p>\r\n<p data-start=\"661\" data-end=\"690\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"692\" data-end=\"1038\">\r\n<li data-start=\"692\" data-end=\"741\">\r\n<p data-start=\"694\" data-end=\"741\">Full-day pre wedding shoot (â¹44,999 se shuru)</p>\r\n</li>\r\n<li data-start=\"742\" data-end=\"807\">\r\n<p data-start=\"744\" data-end=\"807\">Experienced cinematic photographers aur videographers ki team</p>\r\n</li>\r\n<li data-start=\"808\" data-end=\"860\">\r\n<p data-start=\"810\" data-end=\"860\">Designer locations aur theme-based shoot options</p>\r\n</li>\r\n<li data-start=\"861\" data-end=\"925\">\r\n<p data-start=\"863\" data-end=\"925\">Drone shots* aur multiple camera angles for cinematic frames</p>\r\n</li>\r\n<li data-start=\"926\" data-end=\"994\">\r\n<p data-start=\"928\" data-end=\"994\">Professional editing ke saath highlights + full pre-wedding film</p>\r\n</li>\r\n<li data-start=\"995\" data-end=\"1038\">\r\n<p data-start=\"997\" data-end=\"1038\">Customized themes aur add-ons ki à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1040\" data-end=\"1249\">Chahe ek royal palace backdrop ho, natural outdoor garden, beach side romance ya candid coffee date moments &ndash; à¤¹à¤®à¤¾à¤°à¥ team ensure karti hai ki aapka pre-wedding shoot ek <strong data-start=\"1208\" data-end=\"1237\">dreamlike cinematic story</strong> ban jayeà¥¤</p>\r\n<p data-start=\"1251\" data-end=\"1308\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Pre Wedding Shoot Services?</p>\r\n<ul data-start=\"1310\" data-end=\"1512\">\r\n<li data-start=\"1310\" data-end=\"1360\">\r\n<p data-start=\"1312\" data-end=\"1360\">Affordable &amp; premium packages à¤¸à¤¿à¤°à¥à¤« â¹44,999 se</p>\r\n</li>\r\n<li data-start=\"1361\" data-end=\"1410\">\r\n<p data-start=\"1363\" data-end=\"1410\">100+ successful pre-wedding projects ka à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1411\" data-end=\"1455\">\r\n<p data-start=\"1413\" data-end=\"1455\">Creative themes + cinematic storytelling</p>\r\n</li>\r\n<li data-start=\"1456\" data-end=\"1512\">\r\n<p data-start=\"1458\" data-end=\"1512\">Timely delivery aur client satisfaction ki guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1514\" data-end=\"1661\">ð Shaadi se pehle ke pal bhi utne hi important hote hain, aur hamari responsibility hai ki unhe ek <strong data-start=\"1614\" data-end=\"1644\">beautiful cinematic memory</strong> me badla jayeà¥¤</p>\r\n<p data-start=\"1663\" data-end=\"1746\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ aur apne pre-wedding shoot ko ek blockbuster love story bana à¤²à¥à¤!</p>', 49999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('f77f35cd-2fcd-4f33-bd3d-2d9fd388f1b4', 'Pre-Wedding-Shoot-(Price-starts-from)', 49999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('1299329b-7fdf-4ecd-becd-951d8c09b057', '17082033-bfd1-49e4-99bf-db05b821bea9', 'f39a7f99-9558-4536-b9dc-b97ded5b2ced', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Car Booking', '<p data-start=\"135\" data-end=\"195\">ð <strong data-start=\"138\" data-end=\"193\">Car Booking &ndash; Starting from â¹1,199 (Per Day + Fuel)</strong></p>\r\n<p data-start=\"197\" data-end=\"490\">à¤¶à¤¾à¤¦à¥ à¤à¤° functions à¤à¥ à¤¦à¤¿à¤¨ à¤¸à¤¿à¤°à¥à¤« dulha&ndash;dulhan à¤¹à¥ à¤¨à¤¹à¥à¤, à¤¬à¤²à¥à¤à¤¿ family aur guests à¤à¥ à¤²à¤¿à¤ à¤­à¥ comfortable ride à¤¹à¥à¤¨à¤¾ à¤à¤¼à¤°à¥à¤°à¥ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"333\" data-end=\"356\">Car Booking Package</strong> à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ well-maintained aur comfortable cars, à¤¤à¤¾à¤à¤¿ à¤à¤ªà¤à¥ à¤®à¥à¤¹à¤®à¤¾à¤¨ à¤à¤¸à¤¾à¤¨à¥ à¤¸à¥ venue tak à¤ªà¤¹à¥à¤à¤ à¤¸à¤à¥à¤ à¤à¤° à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤à¥à¤ tension à¤¨à¤¾ à¤¹à¥à¥¤</p>\r\n<p data-start=\"492\" data-end=\"525\">â¨ <strong data-start=\"494\" data-end=\"523\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"526\" data-end=\"781\">\r\n<li data-start=\"526\" data-end=\"574\">\r\n<p data-start=\"528\" data-end=\"574\">Car booking à¤¸à¤¿à¤°à¥à¤« â¹1,199 (Per Day + Fuel) à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"575\" data-end=\"632\">\r\n<p data-start=\"577\" data-end=\"632\">Sedan, SUV, Scorpio, Bulero aur Luxury Cars à¤à¤¾ option</p>\r\n</li>\r\n<li data-start=\"633\" data-end=\"672\">\r\n<p data-start=\"635\" data-end=\"672\">Well-maintained aur à¤¸à¤¾à¤«-à¤¸à¥à¤¥à¤°à¥ à¤à¤¾à¤¡à¤¼à¥</p>\r\n</li>\r\n<li data-start=\"673\" data-end=\"717\">\r\n<p data-start=\"675\" data-end=\"717\">Professional driver aur punctual service</p>\r\n</li>\r\n<li data-start=\"718\" data-end=\"781\">\r\n<p data-start=\"720\" data-end=\"781\">à¤à¤ªà¤à¥ à¤à¤¼à¤°à¥à¤°à¤¤ à¤à¥ à¤¹à¤¿à¤¸à¤¾à¤¬ à¤¸à¥ customization aur add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"783\" data-end=\"939\">à¤à¤¾à¤¹à¥ mehmaan ki pickup/drop à¤¹à¥, doli ka special moment ya baraat ka comfortable safar &ndash; à¤¹à¤®à¤¾à¤°à¥ car services à¤¹à¤° ride à¤à¥ safe, smooth aur royal à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¤à¥¤</p>\r\n<p data-start=\"941\" data-end=\"988\">ð <strong data-start=\"944\" data-end=\"986\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Car Services?</strong></p>\r\n<ul data-start=\"989\" data-end=\"1168\">\r\n<li data-start=\"989\" data-end=\"1027\">\r\n<p data-start=\"991\" data-end=\"1027\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹1,199 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1028\" data-end=\"1073\">\r\n<p data-start=\"1030\" data-end=\"1073\">Budget à¤¸à¥ à¤²à¥à¤à¤° Luxury à¤¤à¤ multiple options</p>\r\n</li>\r\n<li data-start=\"1074\" data-end=\"1112\">\r\n<p data-start=\"1076\" data-end=\"1112\">Well-maintained aur decorated cars</p>\r\n</li>\r\n<li data-start=\"1113\" data-end=\"1168\">\r\n<p data-start=\"1115\" data-end=\"1168\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1170\" data-end=\"1256\">ð à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤¹à¤° ride special à¤¹à¥à¤¤à¥ à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ cars à¤à¤¸à¥ à¤à¤° à¤­à¥ à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¤à¥¤</p>\r\n<p data-start=\"1258\" data-end=\"1337\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ke din ko aur bhi hassle-free aur royal à¤¬à¤¨à¤¾à¤à¤à¥¤</p>', 1799.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('1299329b-7fdf-4ecd-becd-951d8c09b057', 'Scorpio-(per-day-+-fuel)', 1799.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('1299329b-7fdf-4ecd-becd-951d8c09b057', 'Bolero-(per-day-+-fuel)', 1599.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('1299329b-7fdf-4ecd-becd-951d8c09b057', 'Dzire-(per-day-+-fuel)', 2999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('80b92f64-7ee6-466b-b561-007041b70224', '17082033-bfd1-49e4-99bf-db05b821bea9', 'e6d3193f-7aca-47f8-8815-a1dd6c35375e', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Bus', '<p data-start=\"208\" data-end=\"270\">ð <strong data-start=\"211\" data-end=\"268\">Bus Booking &ndash; â¹19,999 à¤¸à¥ â¹24,999 (Distance à¤ªà¤° depend)</strong></p>\r\n<p data-start=\"272\" data-end=\"588\">à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ family, friends à¤à¤° à¤¸à¤¾à¤°à¥ guests à¤à¤¾ à¤¸à¤«à¤¼à¤° à¤­à¥ à¤à¤°à¤¾à¤®à¤¦à¤¾à¤¯à¤ à¤à¤° tension-free à¤¹à¥à¤¨à¤¾ à¤à¤¾à¤¹à¤¿à¤à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"379\" data-end=\"402\">Bus Booking Package</strong> à¤à¤ªà¤à¥ à¤ªà¥à¤°à¥ group à¤à¥ à¤à¤ à¤¸à¤¾à¤¥ safe à¤à¤° comfortable travel à¤¦à¥à¤¤à¤¾ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¥ buses spacious à¤¹à¥à¤¤à¥ à¤¹à¥à¤, AC à¤à¤° Non-AC à¤¦à¥à¤¨à¥à¤ options à¤®à¥à¤ available à¤¹à¥à¤ à¤à¤° à¤ªà¥à¤°à¥ à¤¸à¤«à¤° à¤à¥ royal aur smooth à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¤à¥¤</p>\r\n<p data-start=\"590\" data-end=\"623\">â¨ <strong data-start=\"592\" data-end=\"621\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"624\" data-end=\"889\">\r\n<li data-start=\"624\" data-end=\"680\">\r\n<p data-start=\"626\" data-end=\"680\">Bus booking â¹19,999 &ndash; â¹24,999 (distance à¤à¥ à¤¹à¤¿à¤¸à¤¾à¤¬ à¤¸à¥)</p>\r\n</li>\r\n<li data-start=\"681\" data-end=\"713\">\r\n<p data-start=\"683\" data-end=\"713\">AC à¤à¤° Non-AC buses à¤à¤¾ option</p>\r\n</li>\r\n<li data-start=\"714\" data-end=\"751\">\r\n<p data-start=\"716\" data-end=\"751\">30+ à¤¸à¥ 50+ seater buses available</p>\r\n</li>\r\n<li data-start=\"752\" data-end=\"792\">\r\n<p data-start=\"754\" data-end=\"792\">à¤¸à¤¾à¤«à¤¼-à¤¸à¥à¤¥à¤°à¥ aur well-maintained buses</p>\r\n</li>\r\n<li data-start=\"793\" data-end=\"849\">\r\n<p data-start=\"795\" data-end=\"849\">Comfortable seating + music system + clean interiors</p>\r\n</li>\r\n<li data-start=\"850\" data-end=\"889\">\r\n<p data-start=\"852\" data-end=\"889\">Professional aur experienced driver</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"891\" data-end=\"1050\">à¤à¤¾à¤¹à¥ baraat à¤à¥ dhamakedar entry à¤¹à¥, mehmaan ki pickup/drop facility ya functions ke à¤¬à¥à¤ safe travel &ndash; à¤¹à¤®à¤¾à¤°à¥ bus service à¤¹à¤° à¤¸à¤«à¤° à¤à¥ à¤à¤¸à¤¾à¤¨ à¤à¤° à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1052\" data-end=\"1099\">ð <strong data-start=\"1055\" data-end=\"1097\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Bus Services?</strong></p>\r\n<ul data-start=\"1100\" data-end=\"1270\">\r\n<li data-start=\"1100\" data-end=\"1139\">\r\n<p data-start=\"1102\" data-end=\"1139\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹19,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1140\" data-end=\"1180\">\r\n<p data-start=\"1142\" data-end=\"1180\">Multiple seater options (30+ to 50+)</p>\r\n</li>\r\n<li data-start=\"1181\" data-end=\"1223\">\r\n<p data-start=\"1183\" data-end=\"1223\">Safe aur comfortable ride à¤à¥ guarantee</p>\r\n</li>\r\n<li data-start=\"1224\" data-end=\"1270\">\r\n<p data-start=\"1226\" data-end=\"1270\">Timely pickup/drop aur client satisfaction</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1272\" data-end=\"1390\">ð à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ mehmaan ki suvidha à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¥ priority à¤¹à¥à¤¤à¥ à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ bus service à¤à¤¸à¥ à¤à¤à¤¦à¤® hassle-free à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1392\" data-end=\"1466\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ mehmaan ke safar ko comfortable aur royal à¤¬à¤¨à¤¾à¤à¤à¥¤</p>', 24999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('80b92f64-7ee6-466b-b561-007041b70224', 'Bus', 24999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('80b92f64-7ee6-466b-b561-007041b70224', 'Luxury-Bus', 29999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('8e1f326e-aac6-43e5-a08e-af9337f5213f', '2a58f76a-63d9-417e-9f52-51a77ed086c0', '6fad51b4-ba00-4441-a916-b9591960d7ca', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'DJ Service', '<p data-start=\"123\" data-end=\"165\">ð¶ <strong data-start=\"126\" data-end=\"163\">DJ Service &ndash; Starting from â¹9,999</strong></p>\r\n<p data-start=\"167\" data-end=\"428\">à¤¶à¤¾à¤¦à¥ à¤¯à¤¾ à¤à¤¿à¤¸à¥ à¤­à¥ celebration à¤à¤¾ à¤à¤¸à¤²à¥ à¤®à¤à¤¼à¤¾ à¤¹à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"216\" data-end=\"230\">DJ aur dance</em>à¥¤ Vivah Bazaar à¤à¤¾ DJ Service Package à¤à¤ªà¤à¥ event à¤à¥ à¤¬à¤¨à¤¾à¤¤à¤¾ à¤¹à¥ <em data-start=\"290\" data-end=\"321\">à¤§à¤®à¤¾à¤à¥à¤¦à¤¾à¤°, à¤®à¤¸à¥à¤¤à¥à¤­à¤°à¤¾ aur à¤¯à¤¾à¤¦à¤à¤¾à¤°</em>à¥¤ à¤à¤¾à¤¹à¥ à¤à¥à¤à¥ level à¤à¤¾ function à¤¹à¥ à¤¯à¤¾ full grand à¤¶à¤¾à¤¦à¥ à¤à¤¾ event &ndash; à¤¹à¤®à¤¾à¤°à¥ à¤ªà¤¾à¤¸ à¤¹à¤° à¤¤à¤°à¤¹ à¤à¤¾ DJ setup available à¤¹à¥à¥¤</p>\r\n<p data-start=\"430\" data-end=\"463\">â¨ <strong data-start=\"432\" data-end=\"461\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"464\" data-end=\"757\">\r\n<li data-start=\"464\" data-end=\"505\">\r\n<p data-start=\"466\" data-end=\"505\">Basic DJ Service à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"506\" data-end=\"556\">\r\n<p data-start=\"508\" data-end=\"556\">Professional DJ with sound system aur lighting</p>\r\n</li>\r\n<li data-start=\"557\" data-end=\"627\">\r\n<p data-start=\"559\" data-end=\"627\">Wide collection of Bollywood, Punjabi, Bhojpuri aur trending songs</p>\r\n</li>\r\n<li data-start=\"628\" data-end=\"666\">\r\n<p data-start=\"630\" data-end=\"666\">Dance floor lighting aur mic setup</p>\r\n</li>\r\n<li data-start=\"667\" data-end=\"757\">\r\n<p data-start=\"669\" data-end=\"757\">Full DJ Setup â¹35,999 à¤¸à¥ à¤¶à¥à¤°à¥ (Premium sound system + Stage + Lighting + Smoke effect)</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"759\" data-end=\"805\">ð <strong data-start=\"762\" data-end=\"803\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar DJ Services?</strong></p>\r\n<ul data-start=\"806\" data-end=\"1087\">\r\n<li data-start=\"806\" data-end=\"870\">\r\n<p data-start=\"808\" data-end=\"870\">Affordable pricing &ndash; à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥ basic package available</p>\r\n</li>\r\n<li data-start=\"871\" data-end=\"927\">\r\n<p data-start=\"873\" data-end=\"927\">Full DJ Setup grand weddings à¤à¥ à¤²à¤¿à¤ à¤¸à¤¿à¤°à¥à¤« â¹35,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"928\" data-end=\"983\">\r\n<p data-start=\"930\" data-end=\"983\">Professional DJs with latest music aur sound system</p>\r\n</li>\r\n<li data-start=\"984\" data-end=\"1033\">\r\n<p data-start=\"986\" data-end=\"1033\">Lighting, sound aur effects à¤à¤¾ complete combo</p>\r\n</li>\r\n<li data-start=\"1034\" data-end=\"1087\">\r\n<p data-start=\"1036\" data-end=\"1087\">Timely setup aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1089\" data-end=\"1236\">ð à¤¶à¤¾à¤¦à¥ à¤à¤¾ function à¤¸à¤¿à¤°à¥à¤« à¤°à¤¸à¥à¤®à¥à¤ à¤¸à¥ à¤¨à¤¹à¥à¤, à¤¬à¤²à¥à¤à¤¿ <em data-start=\"1137\" data-end=\"1154\">masti aur dance</em> à¤¸à¥ à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤¬à¤¨à¤¤à¤¾ à¤¹à¥à¥¤ à¤à¤° à¤¹à¤®à¤¾à¤°à¤¾ DJ à¤à¤ªà¤à¥ à¤¹à¤° event ko à¤¬à¤¨à¤¾ à¤¦à¥à¤à¤¾ <em data-start=\"1212\" data-end=\"1233\">full on dhamakedaar</em>!</p>\r\n<p data-start=\"1238\" data-end=\"1324\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ke event à¤à¥ à¤¬à¤¨à¤¾ à¤¦à¥à¤ <em data-start=\"1289\" data-end=\"1321\">music, masti aur dance à¤à¤¾ à¤§à¤®à¤¾à¤²</em>!</p>', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('8e1f326e-aac6-43e5-a08e-af9337f5213f', 'DJ', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('8e1f326e-aac6-43e5-a08e-af9337f5213f', 'DJ-Full-Setup', 39999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('513ca700-398c-45e7-a820-68cd89a3bb89', 'a05114e2-4b9f-4192-9941-421b9707892e', 'bc42df9e-45b9-4078-80a4-8092c8a43870', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Mandap Decoration', '<p data-start=\"98\" data-end=\"147\">ð¸ <strong data-start=\"101\" data-end=\"145\">Mandap Decoration &ndash; Starting from â¹4,999</strong></p>\r\n<p data-start=\"149\" data-end=\"400\">à¤¶à¤¾à¤¦à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤ªà¤µà¤¿à¤¤à¥à¤° à¤à¤° à¤à¤¾à¤¸ à¤ªà¤² à¤¹à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"187\" data-end=\"205\">à¤®à¤à¤¡à¤ª à¤ªà¤° à¤¸à¤¾à¤¤ à¤«à¥à¤°à¥</em>à¥¤ Mandap à¤à¥ à¤¸à¤à¤¾à¤µà¤ à¤à¤à¤° royal aur à¤¸à¥à¤à¤¦à¤° à¤¹à¥ à¤¤à¥ à¤ªà¥à¤°à¥ shaadi à¤à¤¾ à¤®à¤¾à¤¹à¥à¤² à¤à¤° à¤­à¥ grand à¤¬à¤¨ à¤à¤¾à¤¤à¤¾ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ Mandap Decoration Package à¤à¤ªà¤à¥ shaadi ke mandap ko à¤¬à¤¨à¤¾à¤¤à¤¾ à¤¹à¥ <em data-start=\"370\" data-end=\"397\">à¤¶à¤¾à¤¨à¤¦à¤¾à¤°, à¤à¤à¤°à¥à¤·à¤ aur à¤¯à¤¾à¤¦à¤à¤¾à¤°</em>à¥¤</p>\r\n<p data-start=\"402\" data-end=\"435\">â¨ <strong data-start=\"404\" data-end=\"433\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"436\" data-end=\"714\">\r\n<li data-start=\"436\" data-end=\"478\">\r\n<p data-start=\"438\" data-end=\"478\">Mandap Decoration à¤¸à¤¿à¤°à¥à¤« â¹4,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"479\" data-end=\"537\">\r\n<p data-start=\"481\" data-end=\"537\">Fresh flowers, designer curtains aur decorative lights</p>\r\n</li>\r\n<li data-start=\"538\" data-end=\"601\">\r\n<p data-start=\"540\" data-end=\"601\">Multiple themes &ndash; Traditional, Modern, Royal aur Customized</p>\r\n</li>\r\n<li data-start=\"602\" data-end=\"656\">\r\n<p data-start=\"604\" data-end=\"656\">Professional decorators aur timely setup à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n<li data-start=\"657\" data-end=\"714\">\r\n<p data-start=\"659\" data-end=\"714\">Budget à¤¸à¥ à¤²à¥à¤à¤° luxury à¤¹à¤° type à¤à¥ decoration available</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"716\" data-end=\"777\">ð <strong data-start=\"719\" data-end=\"775\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Mandap Decoration Services?</strong></p>\r\n<ul data-start=\"778\" data-end=\"974\">\r\n<li data-start=\"778\" data-end=\"816\">\r\n<p data-start=\"780\" data-end=\"816\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹4,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"817\" data-end=\"866\">\r\n<p data-start=\"819\" data-end=\"866\">Fresh flowers aur high-quality d&eacute;cor material</p>\r\n</li>\r\n<li data-start=\"867\" data-end=\"915\">\r\n<p data-start=\"869\" data-end=\"915\">Traditional aur modern à¤¦à¥à¤¨à¥à¤ style à¤®à¥à¤ à¤¸à¤à¤¾à¤µà¤</p>\r\n</li>\r\n<li data-start=\"916\" data-end=\"974\">\r\n<p data-start=\"918\" data-end=\"974\">Timely decoration aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"976\" data-end=\"1082\">ð à¤®à¤à¤¡à¤ª à¤à¤ªà¤à¥ shaadi à¤à¤¾ <em data-start=\"999\" data-end=\"1018\">à¤¸à¤¬à¤¸à¥ à¤ªà¤µà¤¿à¤¤à¥à¤° à¤¸à¥à¤¥à¤¾à¤¨</em> à¤¹à¥, à¤à¤° à¤à¤¸à¤à¥ à¤¸à¤à¤¾à¤µà¤ à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤à¥ à¤¦à¥à¤à¥à¤¨à¤¾ à¤à¤° à¤¦à¥à¤¤à¥ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1084\" data-end=\"1157\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi à¤à¥ à¤®à¤à¤¡à¤ª à¤à¥ à¤¦à¥à¤ à¤à¤ royal aur divine look!</p>', 4999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('513ca700-398c-45e7-a820-68cd89a3bb89', 'Normal', 4999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('513ca700-398c-45e7-a820-68cd89a3bb89', 'Heavy Decoration', 9999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('513ca700-398c-45e7-a820-68cd89a3bb89', 'Designer Decoration', 14999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('513ca700-398c-45e7-a820-68cd89a3bb89', 'Royal Decoration', 24999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('848d7f85-7083-4972-bb1c-4d5508133a7c', '84ee0286-1a68-448b-87c0-3a57b6361f28', 'ebae3402-bb69-40c3-a9cf-26bbcefee9f5', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Drone', '<h3 data-start=\"161\" data-end=\"208\">ð Drone Shoot &ndash; Starting from â¹5,999/day</h3>\r\n<p data-start=\"210\" data-end=\"639\">à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ ke grand moments aur bade-bade venues tabhi pure lagte hain jab unhe <strong data-start=\"289\" data-end=\"304\">aerial view</strong> se capture kiya jaye. Vivah Bazaar ka <strong data-start=\"343\" data-end=\"366\">Drone Shoot Package</strong> aapke wedding venue, rituals aur crowd ko ek unique top-angle se record karta hai, jo normal camera shots se possible hi nahi hotaà¥¤ à¤¹à¤®à¤¾à¤°à¥ professional drone operators latest drones aur 4K cameras ke saath shoot karte hain, taaki har frame ek cinematic aur royal look deà¥¤</p>\r\n<p data-start=\"641\" data-end=\"670\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"672\" data-end=\"1018\">\r\n<li data-start=\"672\" data-end=\"723\">\r\n<p data-start=\"674\" data-end=\"723\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ drone coverage (â¹5,999/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"724\" data-end=\"787\">\r\n<p data-start=\"726\" data-end=\"787\">Certified aur experienced drone operators ki dedicated team</p>\r\n</li>\r\n<li data-start=\"788\" data-end=\"847\">\r\n<p data-start=\"790\" data-end=\"847\">Aerial shots of mandap, varmala, baraat aur grand venue</p>\r\n</li>\r\n<li data-start=\"848\" data-end=\"901\">\r\n<p data-start=\"850\" data-end=\"901\">4K ultra HD video recording aur wide angle frames</p>\r\n</li>\r\n<li data-start=\"902\" data-end=\"966\">\r\n<p data-start=\"904\" data-end=\"966\">Professionally edited drone highlights + cinematic sequences</p>\r\n</li>\r\n<li data-start=\"967\" data-end=\"1018\">\r\n<p data-start=\"969\" data-end=\"1018\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization aur add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1020\" data-end=\"1230\">à¤à¤¾à¤¹à¥ varmala ceremony ki grand entry ho, doli ka upar se emotional moment, baraat ki dhamakedar procession ya stage ka complete view &ndash; drone shots à¤à¤ªà¤à¥ shaadi ko ek <strong data-start=\"1185\" data-end=\"1216\">larger than life experience</strong> banà¤¾à¤¤à¥ à¤¹à¥à¤à¥¤</p>\r\n<p data-start=\"1232\" data-end=\"1283\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Drone Shoot Services?</p>\r\n<ul data-start=\"1285\" data-end=\"1480\">\r\n<li data-start=\"1285\" data-end=\"1327\">\r\n<p data-start=\"1287\" data-end=\"1327\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹5,999/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1328\" data-end=\"1379\">\r\n<p data-start=\"1330\" data-end=\"1379\">100+ successful drone wedding projects à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1380\" data-end=\"1423\">\r\n<p data-start=\"1382\" data-end=\"1423\">Creative aerial shots + premium editing</p>\r\n</li>\r\n<li data-start=\"1424\" data-end=\"1480\">\r\n<p data-start=\"1426\" data-end=\"1480\">Timely delivery aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1482\" data-end=\"1598\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¼à¤¿à¤à¤¦à¤à¥ ka à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration hai, aur drone shots us grandness ko ekà¤¦à¤® cinematic bana dete à¤¹à¥à¤à¥¤</p>\r\n<p data-start=\"1600\" data-end=\"1674\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ aur apni wedding ko ek royal aerial cinematic look dein!</p>', 5999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('848d7f85-7083-4972-bb1c-4d5508133a7c', 'Drone shoot (Price starts from)', 5999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('69ec6a1c-6aaf-43ba-bcea-25ca846d5794', '2a58f76a-63d9-417e-9f52-51a77ed086c0', '4bf295ff-bac9-4f06-9bc3-ef9e7108abbd', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Bhangra', '<p data-start=\"78\" data-end=\"126\">ð <strong data-start=\"81\" data-end=\"124\">Bhangra Service &ndash; Starting from â¹14,999</strong></p>\r\n<p data-start=\"128\" data-end=\"447\">à¤¶à¤¾à¤¦à¥, à¤¬à¤¾à¤°à¤¾à¤¤ à¤¯à¤¾ à¤à¤¿à¤¸à¥ à¤­à¥ celebration à¤à¤¾ à¤®à¤à¤¼à¤¾ à¤¦à¥à¤à¥à¤¨à¤¾ à¤¹à¥ à¤à¤¾à¤¤à¤¾ à¤¹à¥ à¤à¤¬ entry à¤¹à¥à¤¤à¥ à¤¹à¥ <em data-start=\"206\" data-end=\"227\">Bhangra Dance Group</em> à¤à¥ à¤¸à¤¾à¤¥à¥¤ à¤¢à¥à¤² à¤à¥ à¤§à¥à¤¨ à¤à¤° à¤ªà¤à¤à¤¾à¤¬à¥ à¤¤à¤¡à¤¼à¤à¤¾ à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ event ko à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"297\" data-end=\"329\">à¤¦à¤®à¤¦à¤¾à¤°, entertaining aur à¤¯à¤¾à¤¦à¤à¤¾à¤°</em>à¥¤ Vivah Bazaar à¤à¤¾ Bhangra Service Package à¤à¤ªà¤à¥ event à¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"393\" data-end=\"444\">professional dancers aur full energy performances</em>à¥¤</p>\r\n<p data-start=\"449\" data-end=\"482\">â¨ <strong data-start=\"451\" data-end=\"480\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"483\" data-end=\"734\">\r\n<li data-start=\"483\" data-end=\"524\">\r\n<p data-start=\"485\" data-end=\"524\">Bhangra Service à¤¸à¤¿à¤°à¥à¤« â¹14,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"525\" data-end=\"581\">\r\n<p data-start=\"527\" data-end=\"581\">Professional bhangra dancers with traditional attire</p>\r\n</li>\r\n<li data-start=\"582\" data-end=\"625\">\r\n<p data-start=\"584\" data-end=\"625\">Dhol aur high-energy dance performances</p>\r\n</li>\r\n<li data-start=\"626\" data-end=\"672\">\r\n<p data-start=\"628\" data-end=\"672\">Customized entry dance for Dulha aur Barat</p>\r\n</li>\r\n<li data-start=\"673\" data-end=\"734\">\r\n<p data-start=\"675\" data-end=\"734\">Full group performance with choreography option available</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"736\" data-end=\"787\">ð <strong data-start=\"739\" data-end=\"785\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Bhangra Services?</strong></p>\r\n<ul data-start=\"788\" data-end=\"1054\">\r\n<li data-start=\"788\" data-end=\"827\">\r\n<p data-start=\"790\" data-end=\"827\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹14,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"828\" data-end=\"875\">\r\n<p data-start=\"830\" data-end=\"875\">Experienced aur professional bhangra groups</p>\r\n</li>\r\n<li data-start=\"876\" data-end=\"938\">\r\n<p data-start=\"878\" data-end=\"938\">à¤¬à¤¾à¤°à¤¾à¤¤, gate entry aur stage performance à¤à¥ à¤²à¤¿à¤ à¤à¤²à¤ options</p>\r\n</li>\r\n<li data-start=\"939\" data-end=\"998\">\r\n<p data-start=\"941\" data-end=\"998\">High-energy performances jo sabko à¤¨à¤à¤¾à¤¨à¥ à¤ªà¤° à¤®à¤à¤¬à¥à¤° à¤à¤° à¤¦à¥à¤</p>\r\n</li>\r\n<li data-start=\"999\" data-end=\"1054\">\r\n<p data-start=\"1001\" data-end=\"1054\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1056\" data-end=\"1212\">ð à¤¶à¤¾à¤¦à¥ à¤à¤¾ à¤à¤¸à¤²à¥ à¤®à¤à¤¼à¤¾ à¤¤à¤­à¥ à¤à¤¤à¤¾ à¤¹à¥ à¤à¤¬ barati aur guest à¤¸à¤¬ à¤®à¤¿à¤²à¤à¤° dance à¤à¤°à¥à¤ &ndash; à¤à¤° à¤¹à¤®à¤¾à¤°à¤¾ bhangra group à¤à¤ªà¤à¥ event ko à¤¬à¤¨à¤¾ à¤¦à¥à¤à¤¾ <em data-start=\"1176\" data-end=\"1209\">full on dhamakedaar celebration</em>!</p>\r\n<p data-start=\"1214\" data-end=\"1294\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ke event ko à¤¦à¥à¤ à¤à¤ <em data-start=\"1264\" data-end=\"1291\">Punjabi bhangra wala swag</em>!</p>', 14999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('69ec6a1c-6aaf-43ba-bcea-25ca846d5794', 'Bhangra (Starting price)', 14999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('bbe0aaea-4210-47da-a003-60d616c4167f', '2a58f76a-63d9-417e-9f52-51a77ed086c0', '11e7ac46-5623-49ad-9187-f1ed29c85b88', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Band Baza', '<p data-start=\"78\" data-end=\"130\">ð¥ <strong data-start=\"81\" data-end=\"128\">Band Baja DJ Service &ndash; Starting from â¹9,999</strong></p>\r\n<p data-start=\"132\" data-end=\"407\">à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¬à¤¾à¤°à¤¾à¤¤ à¤à¤¾ à¤à¤¸à¤²à¥ à¤®à¤à¤¼à¤¾ à¤¹à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"167\" data-end=\"180\">Band aur DJ</em> à¤à¥ à¤¸à¤¾à¤¥à¥¤ à¤¢à¥à¤²&ndash;à¤¨à¤à¤¾à¤¡à¤¼à¥à¤ à¤à¥ à¤à¥à¤à¤ à¤à¤° DJ à¤à¥ à¤§à¥à¤¨à¥à¤ barat ko à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¤ <em data-start=\"246\" data-end=\"267\">full on dhamakedaar</em>à¥¤ Vivah Bazaar à¤à¤¾ Band Baja DJ Package à¤à¤ªà¤à¥ event ko à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"328\" data-end=\"371\">traditional band ke saath modern DJ beats</em> &ndash; à¤¤à¤¾à¤à¤¿ à¤¹à¤° age group enjoy à¤à¤° à¤¸à¤à¥à¥¤</p>\r\n<p data-start=\"409\" data-end=\"442\">â¨ <strong data-start=\"411\" data-end=\"440\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"443\" data-end=\"728\">\r\n<li data-start=\"443\" data-end=\"488\">\r\n<p data-start=\"445\" data-end=\"488\">Band Baja DJ Service à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"489\" data-end=\"554\">\r\n<p data-start=\"491\" data-end=\"554\">Professional band team with dhol, nagada, trumpet aur shehnai</p>\r\n</li>\r\n<li data-start=\"555\" data-end=\"604\">\r\n<p data-start=\"557\" data-end=\"604\">DJ system with sound, lights aur latest songs</p>\r\n</li>\r\n<li data-start=\"605\" data-end=\"657\">\r\n<p data-start=\"607\" data-end=\"657\">Barat aur Dulha entry ke à¤²à¤¿à¤ special performance</p>\r\n</li>\r\n<li data-start=\"658\" data-end=\"728\">\r\n<p data-start=\"660\" data-end=\"728\">Customized package &ndash; à¤¸à¤¿à¤°à¥à¤« band / à¤¸à¤¿à¤°à¥à¤« DJ / à¤¯à¤¾ à¤¦à¥à¤¨à¥à¤ combo option</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"730\" data-end=\"786\">ð <strong data-start=\"733\" data-end=\"784\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Band Baja DJ Services?</strong></p>\r\n<ul data-start=\"787\" data-end=\"1028\">\r\n<li data-start=\"787\" data-end=\"825\">\r\n<p data-start=\"789\" data-end=\"825\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"826\" data-end=\"875\">\r\n<p data-start=\"828\" data-end=\"875\">Traditional aur modern music à¤à¤¾ perfect combo</p>\r\n</li>\r\n<li data-start=\"876\" data-end=\"921\">\r\n<p data-start=\"878\" data-end=\"921\">Experienced band team aur professional DJ</p>\r\n</li>\r\n<li data-start=\"922\" data-end=\"972\">\r\n<p data-start=\"924\" data-end=\"972\">Lights, sound aur decoration ke à¤¸à¤¾à¤¥ full setup</p>\r\n</li>\r\n<li data-start=\"973\" data-end=\"1028\">\r\n<p data-start=\"975\" data-end=\"1028\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1030\" data-end=\"1185\">ð à¤¶à¤¾à¤¦à¥ à¤à¥ barat à¤¤à¤­à¥ à¤ªà¥à¤°à¥ à¤¹à¥à¤¤à¥ à¤¹à¥ à¤à¤¬ <em data-start=\"1067\" data-end=\"1080\">band aur DJ</em> à¤à¥ à¤§à¥à¤¨ à¤ªà¤° à¤¹à¤° à¤à¥à¤ à¤à¥à¤® à¤à¤ à¥à¥¤ à¤¹à¤®à¤¾à¤°à¥ service à¤à¤ªà¤à¥ celebration à¤à¥ à¤¬à¤¨à¤¾ à¤¦à¥à¤à¥ <em data-start=\"1150\" data-end=\"1182\">grand, entertaining aur à¤¯à¤¾à¤¦à¤à¤¾à¤°</em>!</p>\r\n<p data-start=\"1187\" data-end=\"1269\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ki barat ko à¤¦à¥à¤ ekà¤¦à¤® <em data-start=\"1239\" data-end=\"1266\">dhamakedaar musical touch</em>!</p>', 24999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('bbe0aaea-4210-47da-a003-60d616c4167f', 'Band-Baza-(Starting)', 24999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('eb1a7e9d-328f-4b11-9854-ec4e89042e64', 'a05114e2-4b9f-4192-9941-421b9707892e', 'e46386f9-9548-41c5-bfa3-c69955ba7873', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Bed Decoration', '<p data-start=\"112\" data-end=\"158\">ð¹ <strong data-start=\"115\" data-end=\"156\">Bed Decoration &ndash; Starting from â¹5,499</strong></p>\r\n<p data-start=\"160\" data-end=\"430\">à¤¶à¤¾à¤¦à¥ à¤à¥ à¤ªà¤¹à¤²à¥ à¤°à¤¾à¤¤ à¤¹à¤° à¤¦à¥à¤²à¥à¤¹à¤¾&ndash;à¤¦à¥à¤²à¥à¤¹à¤¨ à¤à¥ à¤²à¤¿à¤ <em data-start=\"201\" data-end=\"224\">à¤¸à¤¬à¤¸à¥ à¤à¤¾à¤¸ à¤à¤° à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤ªà¤²</em> à¤¹à¥à¤¤à¤¾ à¤¹à¥à¥¤ à¤à¤¸ à¤°à¤¾à¤¤ à¤à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤¬à¤¢à¤¼à¤¾à¤¨à¥ à¤à¥ à¤²à¤¿à¤ <em data-start=\"267\" data-end=\"283\">Bed Decoration</em> à¤¬à¥à¤¹à¤¦ à¤à¤¼à¤°à¥à¤°à¥ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ Bed Decoration Package à¤à¤ªà¤à¥ à¤à¤®à¤°à¥ à¤à¥ à¤¬à¤¨à¤¾à¤¤à¤¾ à¤¹à¥ <em data-start=\"361\" data-end=\"390\">romantic, elegant aur royal</em>, à¤¤à¤¾à¤à¤¿ à¤à¤ªà¤à¥ à¤¸à¥à¤¹à¤¾à¤à¤°à¤¾à¤¤ à¤¬à¤¨ à¤¸à¤à¥ à¤à¤° à¤­à¥ à¤à¤¾à¤¸à¥¤</p>\r\n<p data-start=\"432\" data-end=\"465\">â¨ <strong data-start=\"434\" data-end=\"463\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"466\" data-end=\"740\">\r\n<li data-start=\"466\" data-end=\"505\">\r\n<p data-start=\"468\" data-end=\"505\">Bed Decoration à¤¸à¤¿à¤°à¥à¤« â¹5,499 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"506\" data-end=\"571\">\r\n<p data-start=\"508\" data-end=\"571\">Fresh flowers (à¤à¥à¤²à¤¾à¤¬, à¤°à¤à¤¨à¥à¤à¤à¤§à¤¾, à¤à¥à¤à¤¦à¤¾ à¤à¤¦à¤¿) aur designer setup</p>\r\n</li>\r\n<li data-start=\"572\" data-end=\"622\">\r\n<p data-start=\"574\" data-end=\"622\">Decorative candles, lights aur fragrance touch</p>\r\n</li>\r\n<li data-start=\"623\" data-end=\"685\">\r\n<p data-start=\"625\" data-end=\"685\">Multiple themes &ndash; Simple, Traditional, Romantic aur Luxury</p>\r\n</li>\r\n<li data-start=\"686\" data-end=\"740\">\r\n<p data-start=\"688\" data-end=\"740\">Professional decorators aur timely setup à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"742\" data-end=\"800\">ð <strong data-start=\"745\" data-end=\"798\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Bed Decoration Services?</strong></p>\r\n<ul data-start=\"801\" data-end=\"1004\">\r\n<li data-start=\"801\" data-end=\"839\">\r\n<p data-start=\"803\" data-end=\"839\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹5,499 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"840\" data-end=\"893\">\r\n<p data-start=\"842\" data-end=\"893\">Fresh flowers aur premium d&eacute;cor items à¤à¤¾ à¤à¤¸à¥à¤¤à¥à¤®à¤¾à¤²</p>\r\n</li>\r\n<li data-start=\"894\" data-end=\"948\">\r\n<p data-start=\"896\" data-end=\"948\">Customized designs (Traditional à¤¸à¥ à¤²à¥à¤à¤° Modern à¤¤à¤)</p>\r\n</li>\r\n<li data-start=\"949\" data-end=\"1004\">\r\n<p data-start=\"951\" data-end=\"1004\">Timely service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1006\" data-end=\"1144\">ð à¤¶à¤¾à¤¦à¥ à¤à¥ à¤ªà¤¹à¤²à¥ à¤°à¤¾à¤¤ à¤¸à¤¿à¤°à¥à¤« à¤à¤ à¤°à¤¾à¤¤ à¤¨à¤¹à¥à¤, à¤¬à¤²à¥à¤à¤¿ <em data-start=\"1051\" data-end=\"1072\">à¤¨à¤ à¤à¤¿à¤à¤¦à¤à¥ à¤à¥ à¤¶à¥à¤°à¥à¤à¤¤</em> à¤¹à¥à¤¤à¥ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¥ à¤¸à¤à¤¾à¤µà¤ à¤à¤¸ à¤°à¤¾à¤¤ à¤à¥ à¤à¤° à¤­à¥ romantic aur à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤¬à¤¨à¤¾ à¤¦à¥à¤¤à¥ à¤¹à¥à¥¤</p>\r\n<p data-start=\"1146\" data-end=\"1225\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ <em data-start=\"1170\" data-end=\"1187\">à¤¸à¥à¤¹à¤¾à¤à¤°à¤¾à¤¤ à¤à¥ à¤°à¤¾à¤¤</em> à¤à¥ à¤¦à¥à¤ à¤à¤ royal aur romantic touch!</p>', 5499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('eb1a7e9d-328f-4b11-9854-ec4e89042e64', 'Lite Decoration', 5499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('eb1a7e9d-328f-4b11-9854-ec4e89042e64', 'Heavy Decorations', 9999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('eb1a7e9d-328f-4b11-9854-ec4e89042e64', 'Designer Decorations', 15999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('eb1a7e9d-328f-4b11-9854-ec4e89042e64', 'Royal Decorations', 24999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('f26a167b-721b-4384-baf5-950e3183d765', 'c7843255-4208-414f-a106-0b2b620154f0', '33d1b578-d4bc-479f-b086-da1cfce9d6ea', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Basic Makeup', '<p data-start=\"117\" data-end=\"169\">ð <strong data-start=\"120\" data-end=\"167\">Basic Makeup Service &ndash; Starting from â¹1,599</strong></p>\r\n<p data-start=\"171\" data-end=\"377\">à¤¹à¤° à¤¦à¥à¤²à¥à¤¹à¤¨ à¤à¤¾ à¤¸à¤ªà¤¨à¤¾ à¤¹à¥à¤¤à¤¾ à¤¹à¥ à¤à¤¿ à¤à¤¸à¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤µà¤¹ à¤¸à¤¬à¤¸à¥ à¤¸à¥à¤à¤¦à¤° à¤à¤° à¤à¤à¤°à¥à¤·à¤ à¤¦à¤¿à¤à¥à¥¤ Vivah Bazaar à¤à¤¾ Basic Makeup Package à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"297\" data-end=\"323\">natural aur elegant look</em>, à¤¤à¤¾à¤à¤¿ à¤à¤ª à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤à¤®à¤à¥à¤ à¤à¤° à¤¹à¤° à¤¨à¤à¤° à¤à¤ª à¤ªà¤° à¤ à¤¹à¤° à¤à¤¾à¤à¥¤</p>\r\n<p data-start=\"379\" data-end=\"412\">â¨ <strong data-start=\"381\" data-end=\"410\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"413\" data-end=\"655\">\r\n<li data-start=\"413\" data-end=\"457\">\r\n<p data-start=\"415\" data-end=\"457\">Basic Bridal Makeup à¤¸à¤¿à¤°à¥à¤« â¹<strong data-start=\"120\" data-end=\"167\">1,599</strong> à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"458\" data-end=\"521\">\r\n<p data-start=\"460\" data-end=\"521\">Professional makeup artist aur branded products à¤à¤¾ à¤à¤¸à¥à¤¤à¥à¤®à¤¾à¤²</p>\r\n</li>\r\n<li data-start=\"522\" data-end=\"563\">\r\n<p data-start=\"524\" data-end=\"563\">Natural look with long-lasting makeup</p>\r\n</li>\r\n<li data-start=\"564\" data-end=\"608\">\r\n<p data-start=\"566\" data-end=\"608\">Hair styling aur basic accessories setup</p>\r\n</li>\r\n<li data-start=\"609\" data-end=\"655\">\r\n<p data-start=\"611\" data-end=\"655\">Pre-makeup skin care aur touch-up facility</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"657\" data-end=\"713\">ð <strong data-start=\"660\" data-end=\"711\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Basic Makeup Services?</strong></p>\r\n<ul data-start=\"714\" data-end=\"912\">\r\n<li data-start=\"714\" data-end=\"752\">\r\n<p data-start=\"716\" data-end=\"752\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹<strong data-start=\"120\" data-end=\"167\">1,599 </strong>à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"753\" data-end=\"808\">\r\n<p data-start=\"755\" data-end=\"808\">Experienced makeup artists with professional skills</p>\r\n</li>\r\n<li data-start=\"809\" data-end=\"854\">\r\n<p data-start=\"811\" data-end=\"854\">Branded aur skin-friendly products à¤à¤¾ use</p>\r\n</li>\r\n<li data-start=\"855\" data-end=\"912\">\r\n<p data-start=\"857\" data-end=\"912\">Time par service aur client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"914\" data-end=\"1047\">ð à¤¶à¤¾à¤¦à¥ à¤¹à¤° à¤²à¤¡à¤¼à¤à¥ à¤à¥ à¤²à¤¿à¤ <em data-start=\"938\" data-end=\"963\">à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤à¤¾à¤¸ à¤¦à¤¿à¤¨</em> à¤¹à¥à¤¤à¤¾ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¤¾ Basic Makeup Package à¤à¤ªà¤à¥ à¤à¤¸ à¤¦à¤¿à¤¨ à¤à¥ à¤à¤° à¤­à¥ à¤à¤¾à¤¸ aur à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤¬à¤¨à¤¾ à¤¦à¥à¤à¤¾à¥¤</p>\r\n<p data-start=\"1049\" data-end=\"1129\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ wedding look à¤à¥ à¤¦à¥à¤ <em data-start=\"1093\" data-end=\"1126\">simple, elegant aur royal touch</em>!</p>', 1599.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('f26a167b-721b-4384-baf5-950e3183d765', 'Basic-Makeup-(Starting-Price)', 1599.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('c3d3c72a-ced0-427e-9e09-047c998fdc1c', 'c7843255-4208-414f-a106-0b2b620154f0', '96c55193-f92a-4ed5-8d15-4bf0a1246a3d', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Bridal Makeup', '<p data-start=\"68\" data-end=\"121\">ð <strong data-start=\"71\" data-end=\"119\">Bridal Makeup Service &ndash; Starting from â¹7,499</strong></p>\r\n<p data-start=\"123\" data-end=\"329\">à¤¹à¤° à¤¦à¥à¤²à¥à¤¹à¤¨ à¤à¤¾ à¤¸à¤ªà¤¨à¤¾ à¤¹à¥à¤¤à¤¾ à¤¹à¥ à¤à¤¿ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¦à¤¿à¤¨ à¤µà¤¹ à¤¸à¤¬à¤¸à¥ à¤à¥à¤¬à¤¸à¥à¤°à¤¤ à¤à¤° <em data-start=\"183\" data-end=\"190\">royal</em> à¤¦à¤¿à¤à¥à¥¤ Vivah Bazaar à¤à¤¾ Bridal Makeup Package à¤à¤ªà¤à¥ à¤¦à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"248\" data-end=\"292\">flawless, elegant aur picture-perfect look</em>, à¤¤à¤¾à¤à¤¿ à¤¹à¤° à¤¨à¤à¤° à¤¸à¤¿à¤°à¥à¤« à¤à¤ª à¤ªà¤° à¤à¤¿à¤à¥ à¤°à¤¹à¥à¥¤</p>\r\n<p data-start=\"331\" data-end=\"364\">â¨ <strong data-start=\"333\" data-end=\"362\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"365\" data-end=\"651\">\r\n<li data-start=\"365\" data-end=\"403\">\r\n<p data-start=\"367\" data-end=\"403\">Bridal Makeup à¤¸à¤¿à¤°à¥à¤« â¹7,499 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"404\" data-end=\"475\">\r\n<p data-start=\"406\" data-end=\"475\">Professional bridal makeup artists aur branded products à¤à¤¾ à¤à¤¸à¥à¤¤à¥à¤®à¤¾à¤²</p>\r\n</li>\r\n<li data-start=\"476\" data-end=\"535\">\r\n<p data-start=\"478\" data-end=\"535\">Customized bridal look &ndash; Traditional, Modern, Glamorous</p>\r\n</li>\r\n<li data-start=\"536\" data-end=\"590\">\r\n<p data-start=\"538\" data-end=\"590\">Bridal hair styling aur accessories setup included</p>\r\n</li>\r\n<li data-start=\"591\" data-end=\"651\">\r\n<p data-start=\"593\" data-end=\"651\">Long-lasting aur skin-friendly products jo à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¤¿à¤à¥</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"653\" data-end=\"710\">ð <strong data-start=\"656\" data-end=\"708\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Bridal Makeup Services?</strong></p>\r\n<ul data-start=\"711\" data-end=\"974\">\r\n<li data-start=\"711\" data-end=\"749\">\r\n<p data-start=\"713\" data-end=\"749\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹7,499 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"750\" data-end=\"799\">\r\n<p data-start=\"752\" data-end=\"799\">Experienced aur trained bridal makeup artists</p>\r\n</li>\r\n<li data-start=\"800\" data-end=\"846\">\r\n<p data-start=\"802\" data-end=\"846\">Premium quality aur skin-friendly products</p>\r\n</li>\r\n<li data-start=\"847\" data-end=\"916\">\r\n<p data-start=\"849\" data-end=\"916\">Customized makeover jo à¤à¤ªà¤à¥ personality aur dress ke à¤¸à¤¾à¤¥ match à¤¹à¥</p>\r\n</li>\r\n<li data-start=\"917\" data-end=\"974\">\r\n<p data-start=\"919\" data-end=\"974\">Timely service aur 100% client satisfaction guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"976\" data-end=\"1136\">ð à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤à¤¾à¤¸ à¤¦à¤¿à¤¨ à¤¹à¥à¥¤ à¤¹à¤®à¤¾à¤°à¤¾ Bridal Makeup Package à¤à¤ªà¤à¥ look ko à¤¬à¤¨à¤¾à¤à¤à¤¾ <em data-start=\"1065\" data-end=\"1093\">royal, graceful aur à¤¯à¤¾à¤¦à¤à¤¾à¤°</em>, à¤¤à¤¾à¤à¤¿ à¤¹à¤° photo à¤à¤° à¤¹à¤° memory perfect à¤²à¤à¥à¥¤</p>\r\n<p data-start=\"1138\" data-end=\"1212\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ke à¤¦à¤¿à¤¨ ko à¤¦à¥à¤ à¤à¤ <em data-start=\"1186\" data-end=\"1209\">flawless bridal touch</em>!</p>', 7499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('c3d3c72a-ced0-427e-9e09-047c998fdc1c', 'Bridal Makeup', 7499.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('b4cb8d6d-4eda-48df-8ffb-9af5c103211a', 'a05114e2-4b9f-4192-9941-421b9707892e', '27204835-c265-4cf8-97ee-d5ebcfde937d', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', 'Gate Decoration', '<p data-start=\"86\" data-end=\"133\">ð <strong data-start=\"89\" data-end=\"131\">Gate Decoration &ndash; Starting from â¹9,999</strong></p>\r\n<p data-start=\"135\" data-end=\"406\">à¤¶à¤¾à¤¦à¥ à¤à¤¾ à¤ªà¤¹à¤²à¤¾ impression à¤¹à¥à¤¤à¤¾ à¤¹à¥ <em data-start=\"167\" data-end=\"184\">Gate Decoration</em>à¥¤ à¤à¤¬ à¤®à¥à¤¹à¤®à¤¾à¤¨ à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤¸à¥à¤¥à¤² à¤ªà¤° à¤à¤¤à¥ à¤¹à¥à¤, à¤¤à¥ à¤¸à¤¬à¤¸à¥ à¤ªà¤¹à¤²à¥ à¤à¤¨à¤à¥ à¤¨à¤à¤° à¤à¥à¤ à¤à¥ à¤¸à¤à¤¾à¤µà¤ à¤ªà¤° à¤¹à¥ à¤ªà¤¡à¤¼à¤¤à¥ à¤¹à¥à¥¤ Vivah Bazaar à¤à¤¾ Gate Decoration Package à¤à¤ªà¤à¥ shaadi à¤à¥ gate ko à¤¬à¤¨à¤¾à¤¤à¤¾ à¤¹à¥ <em data-start=\"346\" data-end=\"374\">grand, royal aur welcoming</em>, à¤à¤¿à¤¸à¤¸à¥ à¤¹à¤° guest impressed à¤¹à¥à¥¤</p>\r\n<p data-start=\"408\" data-end=\"441\">â¨ <strong data-start=\"410\" data-end=\"439\">à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</strong></p>\r\n<ul data-start=\"442\" data-end=\"716\">\r\n<li data-start=\"442\" data-end=\"482\">\r\n<p data-start=\"444\" data-end=\"482\">Gate Decoration à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥ à¤¶à¥à¤°à¥</p>\r\n</li>\r\n<li data-start=\"483\" data-end=\"545\">\r\n<p data-start=\"485\" data-end=\"545\">Fresh flowers, decorative lights aur designer fabric setup</p>\r\n</li>\r\n<li data-start=\"546\" data-end=\"609\">\r\n<p data-start=\"548\" data-end=\"609\">Multiple themes &ndash; Traditional, Modern, Royal aur Customized</p>\r\n</li>\r\n<li data-start=\"610\" data-end=\"659\">\r\n<p data-start=\"612\" data-end=\"659\">Wide entry arches aur designer welcome boards</p>\r\n</li>\r\n<li data-start=\"660\" data-end=\"716\">\r\n<p data-start=\"662\" data-end=\"716\">Professional decorators aur time par setup à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"718\" data-end=\"777\">ð <strong data-start=\"721\" data-end=\"775\">à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar Gate Decoration Services?</strong></p>\r\n<ul data-start=\"778\" data-end=\"969\">\r\n<li data-start=\"778\" data-end=\"816\">\r\n<p data-start=\"780\" data-end=\"816\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹9,999 à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"817\" data-end=\"864\">\r\n<p data-start=\"819\" data-end=\"864\">Grand aur stylish à¤¸à¤à¤¾à¤µà¤ à¤à¥ à¤¸à¤¬à¤à¥ attract à¤à¤°à¥</p>\r\n</li>\r\n<li data-start=\"865\" data-end=\"914\">\r\n<p data-start=\"867\" data-end=\"914\">Fresh flowers aur premium decoration material</p>\r\n</li>\r\n<li data-start=\"915\" data-end=\"969\">\r\n<p data-start=\"917\" data-end=\"969\">Customized designs aur timely service à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"971\" data-end=\"1093\">ð à¤¶à¤¾à¤¦à¥ à¤à¤¾ gate à¤¹à¥ à¤à¤ªà¤à¥ celebration à¤à¤¾ à¤ªà¤¹à¤²à¤¾ look à¤¹à¥à¤¤à¤¾ à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ à¤¸à¤à¤¾à¤µà¤ à¤à¤ªà¤à¥ event ko aur à¤­à¥ royal aur à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤¬à¤¨à¤¾ à¤¦à¥à¤à¥à¥¤</p>\r\n<p data-start=\"1095\" data-end=\"1180\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ à¤à¤° à¤à¤ªà¤¨à¥ shaadi ke entry gate à¤à¥ à¤¦à¥à¤ grand aur royal à¤¸à¤à¤¾à¤µà¤ à¤à¤¾ touch!</p>', 9999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('b4cb8d6d-4eda-48df-8ffb-9af5c103211a', 'Lite/Normal-Decoration', 9999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('b4cb8d6d-4eda-48df-8ffb-9af5c103211a', 'Heavy-Decoration', 14999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('b4cb8d6d-4eda-48df-8ffb-9af5c103211a', 'Designer-Decoration', 25999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('b4cb8d6d-4eda-48df-8ffb-9af5c103211a', 'Royal-Decoration', 34999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.services (id, category_id, subcategory_id, provider_id, zone_id, name, description, price, is_active) VALUES ('046a9a49-3eaa-46f6-b354-87037246ebf4', '84ee0286-1a68-448b-87c0-3a57b6361f28', '03ea9da1-e723-49ae-b7ad-8773eec56cb4', '5b0ed0a7-7c34-4eda-852e-c7a32f469386', '5ce29515-d1ff-403a-899b-564996753fa9', '4k Video', '<h3 data-start=\"303\" data-end=\"356\">ð¥ 4K Video Shooting &ndash; Starting from â¹6,999/day</h3>\r\n<p data-start=\"358\" data-end=\"792\">à¤à¤ªà¤à¥ à¤¶à¤¾à¤¦à¥ à¤à¥ à¤¹à¤° à¤à¤¾à¤¸ à¤ªà¤² à¤à¥ à¤à¤¬ à¤à¤° à¤­à¥ à¤¬à¥à¤¹à¤¤à¤°à¥à¤¨ à¤¤à¤°à¥à¤à¥ à¤¸à¥ capture à¤à¤¿à¤¯à¤¾ à¤à¤¾à¤à¤à¤¾ <strong data-start=\"429\" data-end=\"452\">4K Ultra HD quality</strong> à¤à¥ à¤¸à¤¾à¤¥à¥¤ Vivah Bazaar à¤à¤¾ <strong data-start=\"477\" data-end=\"506\">4K Video Shooting Package</strong> à¤à¤ªà¤à¥ shaadi à¤à¥ ekdum cinematic look deta hai &ndash; jisme har ek detail, har emotion aur har ritual ekà¤¦à¤® real aur memorable ban jaata haià¥¤ à¤¹à¤®à¤¾à¤°à¥ à¤ªà¥à¤°à¥à¤«à¥à¤¶à¤¨à¤² à¤à¥à¤® latest 4K cameras aur advanced technology ke saath shoot karti hai taaki à¤à¤ªà¤à¥ wedding videos life-time ke liye treasure ban à¤à¤¾à¤à¤à¥¤</p>\r\n<p data-start=\"794\" data-end=\"823\">â¨ à¤à¤¸ à¤ªà¥à¤à¥à¤ à¤®à¥à¤ à¤à¤ªà¤à¥ à¤®à¤¿à¤²à¥à¤à¤¾:</p>\r\n<ul data-start=\"825\" data-end=\"1141\">\r\n<li data-start=\"825\" data-end=\"873\">\r\n<p data-start=\"827\" data-end=\"873\">à¤ªà¥à¤°à¥ à¤¦à¤¿à¤¨ à¤à¥ 4K coverage (â¹6,999/day à¤¸à¥ à¤¶à¥à¤°à¥)</p>\r\n</li>\r\n<li data-start=\"874\" data-end=\"921\">\r\n<p data-start=\"876\" data-end=\"921\">Experienced videographers à¤à¥ dedicated team</p>\r\n</li>\r\n<li data-start=\"922\" data-end=\"966\">\r\n<p data-start=\"924\" data-end=\"966\">Multiple camera angles + cinematic shots</p>\r\n</li>\r\n<li data-start=\"967\" data-end=\"1030\">\r\n<p data-start=\"969\" data-end=\"1030\">Drone shots* à¤à¤° crystal-clear sound à¤à¥ à¤¸à¤¾à¤¥ premium shooting</p>\r\n</li>\r\n<li data-start=\"1031\" data-end=\"1090\">\r\n<p data-start=\"1033\" data-end=\"1090\">Professionally edited wedding highlights + full 4K film</p>\r\n</li>\r\n<li data-start=\"1091\" data-end=\"1141\">\r\n<p data-start=\"1093\" data-end=\"1141\">à¤à¤ªà¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° customization à¤à¤° add-ons à¤à¥ à¤¸à¥à¤µà¤¿à¤§à¤¾</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1143\" data-end=\"1330\">à¤à¤¾à¤¹à¥ varmala à¤à¥ grand entry à¤¹à¥, mehendi à¤à¥ masti, doston ke dance performances ya bidaai ke emotional moments &ndash; à¤¹à¤®à¤¾à¤°à¥ à¤à¥à¤® à¤¹à¤° scene à¤à¥ ek <strong data-start=\"1280\" data-end=\"1301\">blockbuster movie</strong> ki tarah record karti haià¥¤</p>\r\n<p data-start=\"1332\" data-end=\"1389\">ð à¤à¥à¤¯à¥à¤ à¤à¥à¤¨à¥à¤ Vivah Bazaar 4K Video Shooting Services?</p>\r\n<ul data-start=\"1391\" data-end=\"1597\">\r\n<li data-start=\"1391\" data-end=\"1433\">\r\n<p data-start=\"1393\" data-end=\"1433\">Affordable pricing à¤¸à¤¿à¤°à¥à¤« â¹6,999/day à¤¸à¥</p>\r\n</li>\r\n<li data-start=\"1434\" data-end=\"1485\">\r\n<p data-start=\"1436\" data-end=\"1485\">100+ successful wedding video projects à¤à¤¾ à¤à¤¨à¥à¤­à¤µ</p>\r\n</li>\r\n<li data-start=\"1486\" data-end=\"1541\">\r\n<p data-start=\"1488\" data-end=\"1541\">Creative cinematic storytelling + traditional touch</p>\r\n</li>\r\n<li data-start=\"1542\" data-end=\"1597\">\r\n<p data-start=\"1544\" data-end=\"1597\">Timely delivery à¤à¤° client satisfaction à¤à¥ guarantee</p>\r\n</li>\r\n</ul>\r\n<p data-start=\"1599\" data-end=\"1741\">ð à¤à¤ªà¤à¥ shaadi à¤à¤¼à¤¿à¤à¤¦à¤à¥ à¤à¤¾ à¤¸à¤¬à¤¸à¥ à¤¬à¤¡à¤¼à¤¾ celebration à¤¹à¥, à¤à¤° à¤¹à¤®à¤¾à¤°à¥ responsibility à¤¹à¥ à¤à¤¿ à¤¹à¤® à¤¹à¤° à¤ªà¤² à¤à¥ ek <strong data-start=\"1696\" data-end=\"1728\">beautiful 4K cinematic story</strong> à¤®à¥à¤ à¤¬à¤¦à¤²à¥à¤à¥¤</p>\r\n<p data-start=\"1743\" data-end=\"1813\">ð à¤à¤­à¥ à¤¬à¥à¤ à¤à¤°à¥à¤ aur à¤à¤ªà¤¨à¥ wedding ko ek blockbuster 4K film bana à¤²à¥à¤!</p>', 12999.0, true) ON CONFLICT DO NOTHING;
INSERT INTO public.service_variants (service_id, name, price, is_active) VALUES ('046a9a49-3eaa-46f6-b354-87037246ebf4', '4k-Video-(Prices-starts-from)', 12999.0, true) ON CONFLICT DO NOTHING;
COMMIT;