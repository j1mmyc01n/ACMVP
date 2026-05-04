-- Extend providers_1740395000 with full registration fields
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS provider_type text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS abn text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS abn_verified boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS abn_business_name text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ahpra_number text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ahpra_verified boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ndis_number text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS ndis_verified boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS medicare_provider_number text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS insurance_expiry date;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS insurance_doc_url text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS practice_name text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS practice_address jsonb;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS service_areas text[];
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS services_offered text[];
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS telehealth boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS telehealth_platform text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS bulk_billing boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS wait_time text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_type text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_url text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_embed text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS booking_phone text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS accepting_patients boolean DEFAULT true;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS accepts_ndis boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS accepts_medicare boolean DEFAULT false;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0;
ALTER TABLE providers_1740395000 ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- RLS: Insurance documents stored in provider-docs bucket — only provider and admins can read
-- (Run after creating the storage bucket)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('provider-docs', 'provider-docs', false) ON CONFLICT DO NOTHING;
