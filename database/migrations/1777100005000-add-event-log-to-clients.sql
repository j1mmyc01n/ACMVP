/*
# Add event_log column to clients table

1. Changes
   - Adds `event_log` jsonb column to `clients_1777020684735` so that
     client-activity history (access events, notes, check-in links, etc.)
     can be stored and retrieved.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients_1777020684735'
      AND column_name = 'event_log'
  ) THEN
    ALTER TABLE clients_1777020684735 ADD COLUMN event_log jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
