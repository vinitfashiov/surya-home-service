-- Add a second provider for Delhi
INSERT INTO providers (id, company_name, owner_name, email, phone, address, city_id, status, user_id) VALUES
  ('c2222222-2222-2222-2222-222222222222', 'FixIt Solutions', 'Amit Patel', 'fixit@test.com', '9876543211', '456 Park Ave, Delhi', 'a2222222-2222-2222-2222-222222222222', 'active', 'c1d64da8-de4d-4a12-9af8-820f93d51d01')
ON CONFLICT DO NOTHING;

-- Add more services across cities
INSERT INTO services (id, name, description, price, duration, category_id, provider_id, city_id, is_active, rating, review_count) VALUES
  -- Delhi services
  ('d8888888-8888-8888-8888-888888888888', 'Full Home Sanitization', 'Complete home sanitization with anti-bacterial treatment', 2499, 240, 'b1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', true, 4.9, 55),
  ('d9999999-9999-9999-9999-999999999999', 'Tap & Faucet Installation', 'Professional tap and faucet installation', 799, 60, 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', true, 4.5, 18),
  ('da111111-1111-1111-1111-111111111111', 'Switchboard Repair', 'Switchboard and socket repair/replacement', 349, 30, 'b3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', true, 4.4, 22),
  ('da222222-2222-2222-2222-222222222222', 'Split AC Installation', 'Professional split AC installation with copper piping', 3499, 180, 'b4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', true, 4.7, 35),
  ('da333333-3333-3333-3333-333333333333', 'Facial & Cleanup', 'Professional facial and skin cleanup at home', 699, 45, 'b5555555-5555-5555-5555-555555555555', 'c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', true, 4.8, 89),
  -- More Mumbai services
  ('da444444-4444-4444-4444-444444444444', 'Sofa Cleaning', 'Professional sofa and upholstery deep cleaning', 1299, 120, 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.6, 28),
  ('da555555-5555-5555-5555-555555555555', 'Drain Unclogging', 'Kitchen and bathroom drain unclogging service', 599, 45, 'b2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.3, 14),
  ('da666666-6666-6666-6666-666666666666', 'Fan Installation', 'Ceiling fan installation and repair', 449, 45, 'b3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.5, 33),
  ('da777777-7777-7777-7777-777777777777', 'Bridal Makeup', 'Premium bridal makeup package at home', 4999, 120, 'b5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 4.9, 45)
ON CONFLICT DO NOTHING;

-- Add service addons
INSERT INTO service_addons (id, service_id, name, description, price, is_active) VALUES
  ('ad111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Balcony Cleaning', 'Add balcony deep cleaning', 299, true),
  ('ad222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'Kitchen Chimney Clean', 'Add chimney and exhaust cleaning', 499, true),
  ('ad333333-3333-3333-3333-333333333333', 'd5555555-5555-5555-5555-555555555555', 'Gas Refill', 'AC gas top-up', 1500, true),
  ('ad444444-4444-4444-4444-444444444444', 'd6666666-6666-6666-6666-666666666666', 'Beard Trim', 'Add beard trimming service', 149, true)
ON CONFLICT DO NOTHING;

-- Add another banner
INSERT INTO promotional_banners (id, title, subtitle, is_active, display_order) VALUES
  ('f2222222-2222-2222-2222-222222222222', 'Professional Home Cleaning', 'Starting at just ₹599. Book now!', true, 2)
ON CONFLICT DO NOTHING;