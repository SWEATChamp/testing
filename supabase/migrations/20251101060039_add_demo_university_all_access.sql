/*
  # Add Demo University with All Access

  1. Changes
    - Update all RLS policies to allow Demo University users to see all data
    - If user's university is Demo, they bypass filtering and see everything
    - If user's university is specific (Taylor, Sunway, Monash), they only see their data

  2. Security
    - Only Demo University users can see all data
    - Regular university users remain isolated to their university
*/

-- Update classrooms policy
DROP POLICY IF EXISTS "Users can view classrooms from their university" ON classrooms;
CREATE POLICY "Users can view classrooms from their university"
  ON classrooms FOR SELECT
  TO authenticated
  USING (
    -- Demo users see everything
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    -- Regular users see only their university
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update lifts policy
DROP POLICY IF EXISTS "Users can view lifts from their university" ON lifts;
CREATE POLICY "Users can view lifts from their university"
  ON lifts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update parking_lots policy
DROP POLICY IF EXISTS "Users can view parking from their university" ON parking_lots;
CREATE POLICY "Users can view parking from their university"
  ON parking_lots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update library_seats policy
DROP POLICY IF EXISTS "Users can view library seats from their university" ON library_seats;
CREATE POLICY "Users can view library seats from their university"
  ON library_seats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update food_stalls policy
DROP POLICY IF EXISTS "Users can view food stalls from their university" ON food_stalls;
CREATE POLICY "Users can view food stalls from their university"
  ON food_stalls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update courses policy
DROP POLICY IF EXISTS "Users can view courses from their university" ON courses;
CREATE POLICY "Users can view courses from their university"
  ON courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update units policy
DROP POLICY IF EXISTS "Users can view units from their university" ON units;
CREATE POLICY "Users can view units from their university"
  ON units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.university_id = (SELECT id FROM universities WHERE code = 'DEMO')
    )
    OR
    university_id = (
      SELECT university_id FROM user_profiles WHERE id = auth.uid()
    )
  );
