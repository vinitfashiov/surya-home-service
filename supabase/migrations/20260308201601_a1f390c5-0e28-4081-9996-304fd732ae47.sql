
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
