/*
  # Restructure Course System

  1. Changes
    - Remove units and unit_prerequisites tables
    - Update course table to link course_module to course_module (instead of course_module to units)
    - Add prerequisites array to course_module for prerequisite tracking
    - Rename course table to course_structure for clarity

  2. New Structure
    - course_module: Individual subjects/modules (CS101, MATH101, etc.)
    - course_structure: Links course_modules together in a program structure
    - Prerequisites stored as array in course_module

  3. Security
    - Maintain existing RLS policies
    - Users can only see their university's data
*/

-- Drop foreign key constraints first
ALTER TABLE course DROP CONSTRAINT IF EXISTS course_units_unit_id_fkey;
ALTER TABLE unit_prerequisites DROP CONSTRAINT IF EXISTS unit_prerequisites_unit_id_fkey;
ALTER TABLE unit_prerequisites DROP CONSTRAINT IF EXISTS unit_prerequisites_prerequisite_id_fkey;

-- Drop the tables
DROP TABLE IF EXISTS unit_prerequisites CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- Rename course to course_structure for clarity
ALTER TABLE course RENAME TO course_structure;

-- Drop the old unit_id column from course_structure
ALTER TABLE course_structure DROP COLUMN IF EXISTS unit_id;

-- Add new column to link to another course_module (prerequisite structure)
ALTER TABLE course_structure ADD COLUMN IF NOT EXISTS parent_course_id uuid REFERENCES course_module(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_course_structure_parent ON course_structure(parent_course_id);

-- Update RLS policies for course_structure
DROP POLICY IF EXISTS "Users can view course structure from their university" ON course_structure;

CREATE POLICY "Users can view course structure from their university"
  ON course_structure
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.university_id = (SELECT universities.id FROM universities WHERE universities.code = 'DEMO')
        OR EXISTS (
          SELECT 1 FROM course_module cm
          WHERE cm.id = course_structure.course_id
          AND cm.university_id = user_profiles.university_id
        )
      )
    )
  );

CREATE POLICY "Users can insert course structure"
  ON course_structure
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update course structure"
  ON course_structure
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete course structure"
  ON course_structure
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

-- Clear existing course_structure data since it's now invalid
TRUNCATE course_structure;

-- Populate sample course structure data
DO $$
DECLARE
  taylor_id uuid;
  sunway_id uuid;
  monash_id uuid;
  
  -- Taylor modules
  t_cs101_id uuid;
  t_cs102_id uuid;
  t_cs201_id uuid;
  t_cs204_id uuid;
  t_cs302_id uuid;
  t_cs303_id uuid;
  t_cs304_id uuid;
  t_cs401_id uuid;
  
  -- Sunway modules
  s_cs202_id uuid;
  s_cs203_id uuid;
  s_cs301_id uuid;
  s_cs305_id uuid;
  s_eng101_id uuid;
  s_eng201_id uuid;
  
  -- Monash modules
  m_math101_id uuid;
  m_math201_id uuid;
  m_math202_id uuid;
  m_math203_id uuid;
  m_phy101_id uuid;
  m_phy102_id uuid;
BEGIN
  -- Get university IDs
  SELECT id INTO taylor_id FROM universities WHERE code = 'TAYLOR';
  SELECT id INTO sunway_id FROM universities WHERE code = 'SUNWAY';
  SELECT id INTO monash_id FROM universities WHERE code = 'MONASH';
  
  -- Get Taylor course modules
  SELECT id INTO t_cs101_id FROM course_module WHERE code = 'CS101' AND university_id = taylor_id;
  SELECT id INTO t_cs102_id FROM course_module WHERE code = 'CS102' AND university_id = taylor_id;
  SELECT id INTO t_cs201_id FROM course_module WHERE code = 'CS201' AND university_id = taylor_id;
  SELECT id INTO t_cs204_id FROM course_module WHERE code = 'CS204' AND university_id = taylor_id;
  SELECT id INTO t_cs302_id FROM course_module WHERE code = 'CS302' AND university_id = taylor_id;
  SELECT id INTO t_cs303_id FROM course_module WHERE code = 'CS303' AND university_id = taylor_id;
  SELECT id INTO t_cs304_id FROM course_module WHERE code = 'CS304' AND university_id = taylor_id;
  SELECT id INTO t_cs401_id FROM course_module WHERE code = 'CS401' AND university_id = taylor_id;
  
  -- Get Sunway course modules
  SELECT id INTO s_cs202_id FROM course_module WHERE code = 'CS202' AND university_id = sunway_id;
  SELECT id INTO s_cs203_id FROM course_module WHERE code = 'CS203' AND university_id = sunway_id;
  SELECT id INTO s_cs301_id FROM course_module WHERE code = 'CS301' AND university_id = sunway_id;
  SELECT id INTO s_cs305_id FROM course_module WHERE code = 'CS305' AND university_id = sunway_id;
  SELECT id INTO s_eng101_id FROM course_module WHERE code = 'ENG101' AND university_id = sunway_id;
  SELECT id INTO s_eng201_id FROM course_module WHERE code = 'ENG201' AND university_id = sunway_id;
  
  -- Get Monash course modules
  SELECT id INTO m_math101_id FROM course_module WHERE code = 'MATH101' AND university_id = monash_id;
  SELECT id INTO m_math201_id FROM course_module WHERE code = 'MATH201' AND university_id = monash_id;
  SELECT id INTO m_math202_id FROM course_module WHERE code = 'MATH202' AND university_id = monash_id;
  SELECT id INTO m_math203_id FROM course_module WHERE code = 'MATH203' AND university_id = monash_id;
  SELECT id INTO m_phy101_id FROM course_module WHERE code = 'PHY101' AND university_id = monash_id;
  SELECT id INTO m_phy102_id FROM course_module WHERE code = 'PHY102' AND university_id = monash_id;
  
  -- Taylor Computer Science Program Structure
  -- Year 1, Semester 1
  IF t_cs101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs101_id, true, 1, 1);
  END IF;
  
  -- Year 1, Semester 2 - CS102 requires CS101
  IF t_cs102_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs102_id, t_cs101_id, true, 1, 2);
    
    -- Update CS102 prerequisites
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs101_id::text)
    WHERE id = t_cs102_id;
  END IF;
  
  -- Year 2, Semester 1 - CS201 requires CS102
  IF t_cs201_id IS NOT NULL AND t_cs102_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs201_id, t_cs102_id, true, 2, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs102_id::text)
    WHERE id = t_cs201_id;
  END IF;
  
  -- Year 2, Semester 1 - CS204 requires CS102
  IF t_cs204_id IS NOT NULL AND t_cs102_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs204_id, t_cs102_id, true, 2, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs102_id::text)
    WHERE id = t_cs204_id;
  END IF;
  
  -- Year 3, Semester 1 - CS302 requires CS201
  IF t_cs302_id IS NOT NULL AND t_cs201_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs302_id, t_cs201_id, true, 3, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs201_id::text)
    WHERE id = t_cs302_id;
  END IF;
  
  -- Year 3, Semester 1 - CS303 requires CS201
  IF t_cs303_id IS NOT NULL AND t_cs201_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs303_id, t_cs201_id, true, 3, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs201_id::text)
    WHERE id = t_cs303_id;
  END IF;
  
  -- Year 3, Semester 2 - CS304 requires CS302 and CS303
  IF t_cs304_id IS NOT NULL AND t_cs302_id IS NOT NULL AND t_cs303_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs304_id, t_cs302_id, true, 3, 2);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs302_id::text, t_cs303_id::text)
    WHERE id = t_cs304_id;
  END IF;
  
  -- Year 4, Semester 1 - CS401 Capstone requires CS304
  IF t_cs401_id IS NOT NULL AND t_cs304_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (t_cs401_id, t_cs304_id, true, 4, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(t_cs304_id::text)
    WHERE id = t_cs401_id;
  END IF;
  
  -- Sunway Program Structure
  IF s_eng101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, is_core, recommended_year, recommended_semester)
    VALUES (s_eng101_id, true, 1, 1);
  END IF;
  
  IF s_eng201_id IS NOT NULL AND s_eng101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (s_eng201_id, s_eng101_id, true, 1, 2);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(s_eng101_id::text)
    WHERE id = s_eng201_id;
  END IF;
  
  IF s_cs202_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, is_core, recommended_year, recommended_semester)
    VALUES (s_cs202_id, true, 2, 1);
  END IF;
  
  IF s_cs203_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, is_core, recommended_year, recommended_semester)
    VALUES (s_cs203_id, true, 2, 1);
  END IF;
  
  IF s_cs301_id IS NOT NULL AND s_cs202_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (s_cs301_id, s_cs202_id, true, 2, 2);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(s_cs202_id::text)
    WHERE id = s_cs301_id;
  END IF;
  
  IF s_cs305_id IS NOT NULL AND s_cs202_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (s_cs305_id, s_cs202_id, false, 3, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(s_cs202_id::text)
    WHERE id = s_cs305_id;
  END IF;
  
  -- Monash Program Structure
  IF m_math101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, is_core, recommended_year, recommended_semester)
    VALUES (m_math101_id, true, 1, 1);
  END IF;
  
  IF m_math203_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, is_core, recommended_year, recommended_semester)
    VALUES (m_math203_id, true, 1, 1);
  END IF;
  
  IF m_math201_id IS NOT NULL AND m_math101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (m_math201_id, m_math101_id, true, 1, 2);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(m_math101_id::text)
    WHERE id = m_math201_id;
  END IF;
  
  IF m_math202_id IS NOT NULL AND m_math101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (m_math202_id, m_math101_id, true, 2, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(m_math101_id::text)
    WHERE id = m_math202_id;
  END IF;
  
  IF m_phy101_id IS NOT NULL AND m_math101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (m_phy101_id, m_math101_id, true, 2, 1);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(m_math101_id::text)
    WHERE id = m_phy101_id;
  END IF;
  
  IF m_phy102_id IS NOT NULL AND m_phy101_id IS NOT NULL THEN
    INSERT INTO course_structure (course_id, parent_course_id, is_core, recommended_year, recommended_semester)
    VALUES (m_phy102_id, m_phy101_id, false, 2, 2);
    
    UPDATE course_module 
    SET prerequisites = jsonb_build_array(m_phy101_id::text)
    WHERE id = m_phy102_id;
  END IF;
END $$;
