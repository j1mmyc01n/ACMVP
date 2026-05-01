-- Add approximate geographic coordinates to care_centres_1777090000 so the
-- CRN request flow can attach a new client to the closest active centre by
-- distance. Coordinates are stored as decimal degrees (WGS84). All columns
-- are nullable — centres without coordinates are simply skipped during the
-- nearest-centre lookup.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN latitude double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'care_centres_1777090000' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE care_centres_1777090000 ADD COLUMN longitude double precision;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS care_centres_1777090000_latlng_idx
  ON care_centres_1777090000 (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Backfill demo coordinates for the seed centres referenced in the client
-- check-in resources panel (Camperdown / RPA / Headspace) so the nearest-
-- centre match has data to work with even on a fresh deploy. ON CONFLICT
-- not used because the suffix is not necessarily unique; we update by name.
UPDATE care_centres_1777090000
   SET latitude = -33.8898, longitude = 151.1783
 WHERE latitude IS NULL
   AND longitude IS NULL
   AND (
     LOWER(name) LIKE '%camperdown%'
     OR LOWER(COALESCE(address, '')) LIKE '%camperdown%'
   );

UPDATE care_centres_1777090000
   SET latitude = -33.8888, longitude = 151.1820
 WHERE latitude IS NULL
   AND longitude IS NULL
   AND LOWER(name) LIKE '%rpa%';

UPDATE care_centres_1777090000
   SET latitude = -33.8884, longitude = 151.1799
 WHERE latitude IS NULL
   AND longitude IS NULL
   AND LOWER(name) LIKE '%headspace%';

-- Make sure there is at least one resolvable centre so the nearest-centre
-- lookup always returns a match for a Sydney-area client. This row is the
-- baseline "Camperdown Main" that the seed flow already inserts; we only
-- create it if no active centre with coordinates currently exists.
INSERT INTO care_centres_1777090000 (name, suffix, address, status, latitude, longitude)
SELECT 'Camperdown Main', 'CMP', '96 Carillon Ave, Newtown NSW 2042', 'active', -33.8898, 151.1783
WHERE NOT EXISTS (
  SELECT 1 FROM care_centres_1777090000
   WHERE latitude IS NOT NULL AND longitude IS NOT NULL
);
