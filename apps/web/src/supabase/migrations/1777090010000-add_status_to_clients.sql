/*
# Add Status and Offboard Reason to Clients Table
1. Changes
- Add `status` column to `clients_1777020684735` to track active/offboarded state
- Add `offboard_reason` column to track why a client was offboarded
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients_1777020684735' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE clients_1777020684735 ADD COLUMN status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients_1777020684735' 
    AND column_name = 'offboard_reason'
  ) THEN
    ALTER TABLE clients_1777020684735 ADD COLUMN offboard_reason text;
  END IF;
END $$;