-- Create payout_requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Allow providers to select their own payout requests
CREATE POLICY "Providers can view their own payout requests" 
ON payout_requests FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM providers WHERE id = provider_id
));

-- Allow providers to insert their own payout requests
CREATE POLICY "Providers can create payout requests" 
ON payout_requests FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM providers WHERE id = provider_id
));

-- Allow admins full control
CREATE POLICY "Admins have full access to payout requests" 
ON payout_requests TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
