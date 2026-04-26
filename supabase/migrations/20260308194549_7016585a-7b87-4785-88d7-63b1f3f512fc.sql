-- Demo providers/services/addons seed removed: depended on a fake auth.users id from the original Lovable project.
-- Create real providers and services via /admin panel after signup.

-- Add another banner
INSERT INTO promotional_banners (id, title, subtitle, is_active, display_order) VALUES
  ('f2222222-2222-2222-2222-222222222222', 'Professional Home Cleaning', 'Starting at just ₹599. Book now!', true, 2)
ON CONFLICT DO NOTHING;