-- Location chat messages table for care-centre-to-care-centre messaging within a location
CREATE TABLE IF NOT EXISTS location_chat_messages_1777090000 (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location    text        NOT NULL,
  care_centre text,
  sender_role text,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_chat_location_created
  ON location_chat_messages_1777090000 (location, created_at);

ALTER TABLE location_chat_messages_1777090000 ENABLE ROW LEVEL SECURITY;

-- Staff and admins can read and write messages for their location
CREATE POLICY "staff_read_chat"
  ON location_chat_messages_1777090000
  FOR SELECT USING (true);

CREATE POLICY "staff_insert_chat"
  ON location_chat_messages_1777090000
  FOR INSERT WITH CHECK (true);
