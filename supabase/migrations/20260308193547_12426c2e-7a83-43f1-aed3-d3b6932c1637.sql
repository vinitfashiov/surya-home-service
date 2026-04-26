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