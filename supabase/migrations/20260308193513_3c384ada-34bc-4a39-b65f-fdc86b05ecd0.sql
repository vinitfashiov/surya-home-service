INSERT INTO cities (id, name, state, is_active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Mumbai', 'Maharashtra', true),
  ('a2222222-2222-2222-2222-222222222222', 'Delhi', 'Delhi', true),
  ('a3333333-3333-3333-3333-333333333333', 'Bangalore', 'Karnataka', true),
  ('a4444444-4444-4444-4444-444444444444', 'Hyderabad', 'Telangana', true),
  ('a5555555-5555-5555-5555-555555555555', 'Pune', 'Maharashtra', true),
  ('a6666666-6666-6666-6666-666666666666', 'Chennai', 'Tamil Nadu', true)
ON CONFLICT DO NOTHING;