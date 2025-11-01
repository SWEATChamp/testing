/*
  # Add Charging Port to Library Seats

  1. Changes
    - Add `has_charging_port` boolean column to `library_seats` table
    - Default value is false
    - Update existing records with random true/false values for demo purposes

  2. Notes
    - This allows users to filter study spaces by charging port availability
    - Helps students find seats with power outlets for their devices
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'library_seats' AND column_name = 'has_charging_port'
  ) THEN
    ALTER TABLE library_seats ADD COLUMN has_charging_port boolean DEFAULT false;
  END IF;
END $$;

UPDATE library_seats
SET has_charging_port = (random() > 0.4)
WHERE has_charging_port IS NULL OR has_charging_port = false;
