ALTER TABLE providers ADD COLUMN IF NOT EXISTS aadhaar_number text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS aadhaar_verified boolean DEFAULT false;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS pan_number text;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS gst_number text;
