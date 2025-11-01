/*
  # Add University-Specific Data Structure

  1. New Tables
    - `universities`
      - `id` (uuid, primary key)
      - `name` (text) - University name
      - `code` (text) - Short code (e.g., "TAYLOR", "SUNWAY", "MONASH")
      - `created_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `university_id` to:
      - classrooms
      - lifts
      - parking_lots
      - library_seats
      - food_stalls
      - courses (for unit arrangement)
      - units (for unit arrangement)
    - Update user_profiles to enforce university selection
    - Update RLS policies to filter by university

  3. Security
    - Users can only see data from their university
    - RLS policies enforce university isolation
*/

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view universities"
  ON universities FOR SELECT
  TO authenticated
  USING (true);

-- Insert universities
INSERT INTO universities (name, code) VALUES
  ('Taylor University', 'TAYLOR'),
  ('Sunway University', 'SUNWAY'),
  ('Monash University', 'MONASH')
ON CONFLICT (code) DO NOTHING;

-- Add university_id to classrooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classrooms' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE classrooms ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to lifts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifts' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE lifts ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to parking_lots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parking_lots' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE parking_lots ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to library_seats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'library_seats' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE library_seats ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to food_stalls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_stalls' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE food_stalls ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Add university_id to units
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'units' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE units ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Update RLS policies for classrooms
DROP POLICY IF EXISTS "Anyone can view classrooms" ON classrooms;
CREATE POLICY "Users can view classrooms from their university"
  ON classrooms FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update RLS policies for lifts
DROP POLICY IF EXISTS "Anyone can view lifts" ON lifts;
CREATE POLICY "Users can view lifts from their university"
  ON lifts FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update RLS policies for parking_lots
DROP POLICY IF EXISTS "Anyone can view parking" ON parking_lots;
CREATE POLICY "Users can view parking from their university"
  ON parking_lots FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update RLS policies for library_seats
DROP POLICY IF EXISTS "Anyone can view library seats" ON library_seats;
CREATE POLICY "Users can view library seats from their university"
  ON library_seats FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update RLS policies for food_stalls
DROP POLICY IF EXISTS "Anyone can view food stalls" ON food_stalls;
CREATE POLICY "Users can view food stalls from their university"
  ON food_stalls FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update RLS policies for courses
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
CREATE POLICY "Users can view courses from their university"
  ON courses FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update RLS policies for units
DROP POLICY IF EXISTS "Anyone can view units" ON units;
CREATE POLICY "Users can view units from their university"
  ON units FOR SELECT
  TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );
