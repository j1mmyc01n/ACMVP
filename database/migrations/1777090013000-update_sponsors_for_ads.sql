/*
# Update Sponsors for Ads and Queue

1. Changes
  - Add `ad_image_1` and `ad_image_2` (text) to `sponsors_1777090009` table for additional carousel banners
  - Add `start_date` and `end_date` (date) to handle waitlist queue and scheduling
  - Add `receipt_number` (text) and `amount` (numeric) for professional receipts
  - Set default dates for existing active sponsors
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsors_1777090009' AND column_name = 'ad_image_1') THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN ad_image_1 text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsors_1777090009' AND column_name = 'ad_image_2') THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN ad_image_2 text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsors_1777090009' AND column_name = 'start_date') THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsors_1777090009' AND column_name = 'end_date') THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN end_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsors_1777090009' AND column_name = 'receipt_number') THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN receipt_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsors_1777090009' AND column_name = 'amount') THEN
    ALTER TABLE sponsors_1777090009 ADD COLUMN amount numeric DEFAULT 15000;
  END IF;
END $$;

-- Backfill dates for any existing rows where start_date is null
UPDATE sponsors_1777090009 
SET start_date = CURRENT_DATE, end_date = CURRENT_DATE + INTERVAL '14 days' 
WHERE start_date IS NULL;