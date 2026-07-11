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


