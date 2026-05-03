/*
# Add clinical notes and feedback system

1. Changes
  - Add `clinical_notes` column to check_ins table
  - Add `assigned_to` and `priority` to feedback_tickets

2. New Tables
  - `clinical_notes_1777090003` for detailed clinical documentation

3. Security
  - Enable RLS on new tables
*/

-- Add clinical notes to check-ins
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'check_ins_1740395000' AND column_name = 'clinical_notes'
  ) THEN 
    ALTER TABLE check_ins_1740395000 ADD COLUMN clinical_notes text;
  END IF; 
END $$;

-- Create detailed clinical notes table
CREATE TABLE IF NOT EXISTS clinical_notes_1777090003 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid REFERENCES check_ins_1740395000(id),
  crn text NOT NULL,
  author text NOT NULL,
  note_type text DEFAULT 'general',
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinical_notes_1777090003 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on clinical_notes" ON clinical_notes_1777090003 FOR ALL USING (true);

-- Enhance feedback tickets
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback_tickets_1777090000' AND column_name = 'assigned_to'
  ) THEN 
    ALTER TABLE feedback_tickets_1777090000 ADD COLUMN assigned_to text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback_tickets_1777090000' AND column_name = 'priority'
  ) THEN 
    ALTER TABLE feedback_tickets_1777090000 ADD COLUMN priority text DEFAULT 'medium';
  END IF;
END $$;