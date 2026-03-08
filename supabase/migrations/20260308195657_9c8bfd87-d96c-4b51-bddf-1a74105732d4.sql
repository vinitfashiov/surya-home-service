
-- Seed provider availability for next 14 days for both providers
INSERT INTO provider_availability (provider_id, date, is_available, start_time, end_time, max_bookings_per_slot, note)
SELECT 
  p.id,
  d::date,
  true,
  '9:00 AM',
  '5:00 PM',
  3,
  'Regular working day'
FROM providers p
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + interval '14 days', interval '1 day') d
WHERE p.id IN ('c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;
