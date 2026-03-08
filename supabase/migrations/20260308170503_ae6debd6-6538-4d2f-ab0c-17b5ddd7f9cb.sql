
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
