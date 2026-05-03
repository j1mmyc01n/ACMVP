/*
# Add clinical notes to check-ins

1. Changes
  - Add `clinical_notes` column to `check_ins_1740395000`
  - Add `last_edited_by` column to track who edited
  - Add `last_edited_at` timestamp

2. Security
  - Maintain existing RLS policies
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'check_ins_1740395000' AND column_name = 'clinical_notes'
  ) THEN 
    ALTER TABLE check_ins_1740395000 ADD COLUMN clinical_notes text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'check_ins_1740395000' AND column_name = 'last_edited_by'
  ) THEN 
    ALTER TABLE check_ins_1740395000 ADD COLUMN last_edited_by text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'check_ins_1740395000' AND column_name = 'last_edited_at'
  ) THEN 
    ALTER TABLE check_ins_1740395000 ADD COLUMN last_edited_at timestamptz;
  END IF;
END $$;