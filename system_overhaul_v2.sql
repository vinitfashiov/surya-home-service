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
