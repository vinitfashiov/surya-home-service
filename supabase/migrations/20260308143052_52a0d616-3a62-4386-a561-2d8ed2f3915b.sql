
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
