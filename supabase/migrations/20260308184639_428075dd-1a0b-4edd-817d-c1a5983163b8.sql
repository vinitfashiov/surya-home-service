
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
