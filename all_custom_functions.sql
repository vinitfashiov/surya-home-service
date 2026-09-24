ALTER TABLE public.services ADD COLUMN IF NOT EXISTS starting_price numeric DEFAULT 0;

ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS aadhaar_verified boolean DEFAULT false;

ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS aadhaar_number text;


-- Function: rls_auto_enable

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;


-- Function: fn_update_service_starting_price

CREATE OR REPLACE FUNCTION public.fn_update_service_starting_price()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.services
    SET starting_price = (
        SELECT COALESCE(MIN(price), 0)
        FROM public.service_variants
        WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
    )
    WHERE id = COALESCE(NEW.service_id, OLD.service_id);
    RETURN NEW;
END;
$function$
;


-- Function: has_role

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$
;


-- Function: handle_new_user

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


-- Function: update_updated_at

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;


-- Function: get_service_catalog_v2

CREATE OR REPLACE FUNCTION public.get_service_catalog_v2(p_category_id uuid DEFAULT NULL::uuid, p_city_id uuid DEFAULT NULL::uuid, p_zone_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(t) INTO result
    FROM (
        SELECT 
            s.*,
            (SELECT json_build_object('id', p.id, 'company_name', p.company_name) FROM public.providers p WHERE p.id = s.provider_id) as provider,
            (SELECT json_build_object('id', c.id, 'name', c.name, 'icon', c.icon) FROM public.service_categories c WHERE c.id = s.category_id) as category,
            (
                SELECT jsonb_agg(v.* ORDER BY v.price ASC)
                FROM public.service_variants v
                WHERE v.service_id = s.id
            ) as packages
        FROM public.services s
        WHERE s.is_active = true
        AND (p_category_id IS NULL OR s.category_id = p_category_id)
        AND (p_city_id IS NULL OR s.city_id = p_city_id OR s.city_id IS NULL)
        AND (p_zone_id IS NULL OR s.zone_id = p_zone_id)
        ORDER BY s.rating DESC NULLS LAST, s.name ASC
    ) t;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
;


-- Function: get_targeted_ads

CREATE OR REPLACE FUNCTION public.get_targeted_ads(p_city_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 5)
 RETURNS SETOF ad_campaigns
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


-- Function: create_provider_employee

CREATE OR REPLACE FUNCTION public.create_provider_employee(p_provider_id uuid, p_name text, p_email text, p_phone text, p_password text, p_permissions text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


-- Function: create_admin_employee

CREATE OR REPLACE FUNCTION public.create_admin_employee(p_name text, p_email text, p_password text, p_department text, p_permissions text[], p_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;


-- ==================================================

-- System Overhaul v2 SQL

-- ==================================================

-- 1. Add starting_price to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS starting_price numeric DEFAULT 0;

-- 2. Trigger function to keep starting_price in sync
CREATE OR REPLACE FUNCTION public.fn_update_service_starting_price()
RETURNS TRIGGER AS $body$
BEGIN
    UPDATE public.services
    SET starting_price = (
        SELECT COALESCE(MIN(price), 0)
        FROM public.service_variants
        WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
    )
    WHERE id = COALESCE(NEW.service_id, OLD.service_id);
    RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

-- 3. Re-attach trigger
DROP TRIGGER IF EXISTS tr_update_starting_price ON public.service_variants;
CREATE TRIGGER tr_update_starting_price
AFTER INSERT OR UPDATE OR DELETE ON public.service_variants
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_service_starting_price();

-- 4. Sync existing data
UPDATE public.services s
SET starting_price = (
    SELECT COALESCE(MIN(price), 0)
    FROM public.service_variants v
    WHERE v.service_id = s.id
)
WHERE EXISTS (SELECT 1 FROM public.service_variants v WHERE v.service_id = s.id);

UPDATE public.services
SET starting_price = price
WHERE starting_price = 0 AND price > 0;

-- 5. The Core Catalog RPC (The \"Brain\")
CREATE OR REPLACE FUNCTION public.get_service_catalog_v2(
    p_category_id uuid DEFAULT NULL,
    p_city_id uuid DEFAULT NULL,
    p_zone_id uuid DEFAULT NULL
)
RETURNS JSONB AS $body$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(t) INTO result
    FROM (
        SELECT 
            s.*,
            (SELECT json_build_object('id', p.id, 'company_name', p.company_name) FROM public.providers p WHERE p.id = s.provider_id) as provider,
            (SELECT json_build_object('id', c.id, 'name', c.name, 'icon', c.icon) FROM public.service_categories c WHERE c.id = s.category_id) as category,
            (
                SELECT jsonb_agg(v.* ORDER BY v.price ASC)
                FROM public.service_variants v
                WHERE v.service_id = s.id
            ) as packages
        FROM public.services s
        WHERE s.is_active = true
        AND (p_category_id IS NULL OR s.category_id = p_category_id)
        AND (p_city_id IS NULL OR s.city_id = p_city_id OR s.city_id IS NULL)
        AND (p_zone_id IS NULL OR s.zone_id = p_zone_id)
        ORDER BY s.rating DESC NULLS LAST, s.name ASC
    ) t;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$body$ LANGUAGE plpgsql;
