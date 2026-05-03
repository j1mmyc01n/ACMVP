/*
# Add support_category to clients table and reload cache
1. Changes
   - Adds `support_category` column to `clients_1777020684735` to fix the schema cache error.
   - Force reloads PostgREST schema cache to ensure the UI picks up the new column immediately.
*/
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients_1777020684735' AND column_name = 'support_category'
  ) THEN 
    ALTER TABLE clients_1777020684735 ADD COLUMN support_category text DEFAULT 'general';
  END IF; 
END $$;

NOTIFY pgrst, 'reload schema';