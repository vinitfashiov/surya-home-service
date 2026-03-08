
INSERT INTO platform_settings (key, value) VALUES 
  ('cancellation_free_minutes', '30'),
  ('cancellation_fee_percent', '10'),
  ('cancellation_enabled', 'true')
ON CONFLICT DO NOTHING;
