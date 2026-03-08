INSERT INTO service_categories (id, name, description, icon, is_active, commission_rate, category_type) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Home Cleaning', 'Professional home cleaning services', 'Sparkles', true, 20, 'standard'),
  ('b2222222-2222-2222-2222-222222222222', 'Plumbing', 'Expert plumbing repair and installation', 'Wrench', true, 15, 'standard'),
  ('b3333333-3333-3333-3333-333333333333', 'Electrical', 'Electrical repair and wiring services', 'Zap', true, 15, 'standard'),
  ('b4444444-4444-4444-4444-444444444444', 'AC & Appliance Repair', 'AC servicing and appliance repair', 'Fan', true, 18, 'standard'),
  ('b5555555-5555-5555-5555-555555555555', 'Salon at Home', 'Beauty and grooming at your doorstep', 'Scissors', true, 25, 'standard')
ON CONFLICT DO NOTHING;

INSERT INTO providers (id, company_name, owner_name, email, phone, address, city_id, status, user_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CleanPro Services', 'Rahul Sharma', 'cleanpro@test.com', '9876543210', '123 Main St, Mumbai', 'a1111111-1111-1111-1111-111111111111', 'active', 'c1d64da8-de4d-4a12-9af8-820f93d51d01')
ON CONFLICT DO NOTHING;

INSERT INTO services (id, name, description, price, duration, category_id, provider_id, city_id, is_active, rating, review_count) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Deep Home Cleaning', 'Complete deep cleaning of your home', 1999, 180, 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.5, 23),
  ('d2222222-2222-2222-2222-222222222222', 'Bathroom Cleaning', 'Thorough bathroom sanitization', 599, 60, 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.3, 15),
  ('d3333333-3333-3333-3333-333333333333', 'Pipe Leak Repair', 'Fix leaking pipes and faucets', 499, 45, 'b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.7, 31),
  ('d4444444-4444-4444-4444-444444444444', 'Electrical Wiring', 'Complete house wiring and repair', 1499, 120, 'b3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.2, 8),
  ('d5555555-5555-5555-5555-555555555555', 'AC Service & Repair', 'AC gas refill, cleaning, and repair', 999, 90, 'b4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.6, 42),
  ('d6666666-6666-6666-6666-666666666666', 'Haircut at Home', 'Professional haircut at your doorstep', 399, 30, 'b5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.8, 67),
  ('d7777777-7777-7777-7777-777777777777', 'Kitchen Deep Clean', 'Heavy-duty kitchen cleaning', 899, 90, 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', true, 4.4, 19)
ON CONFLICT DO NOTHING;

INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, is_active) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'FIRST50', 'percentage', 50, 500, 200, 100, true)
ON CONFLICT DO NOTHING;

INSERT INTO promotional_banners (id, title, subtitle, is_active, display_order) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Get 50% Off Your First Booking!', 'Use code FIRST50 at checkout', true, 1)
ON CONFLICT DO NOTHING;