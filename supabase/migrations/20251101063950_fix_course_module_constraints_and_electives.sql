/*
  # Fix Course Module Constraints and Add Electives

  1. Changes
    - Drop global unique constraint on course_module.code
    - Add composite unique constraint on (code, university_id)
    - Add proper elective modules for Taylor University
    - Clean up duplicate course_structure entries

  2. New Electives
    - Taylor: CS305 (Cloud Computing), CS307 (Blockchain Technology)
    - Keeps existing electives for other universities
*/

-- Drop the global unique constraint on code
ALTER TABLE course_module DROP CONSTRAINT IF EXISTS courses_code_key;

-- Add composite unique constraint (code + university_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_module_code_university 
ON course_module(code, university_id);

-- Now add electives for Taylor
DO $$
DECLARE
  taylor_id uuid;
  taylor_cs_id uuid;
  cs305_id uuid;
  cs306_id uuid;
  cs307_id uuid;
BEGIN
  -- Get IDs
  SELECT id INTO taylor_id FROM universities WHERE code = 'TAYLOR';
  SELECT id INTO taylor_cs_id FROM courses WHERE code = 'BCS' AND university_id = taylor_id;
  
  -- Get existing CS306
  SELECT id INTO cs306_id FROM course_module WHERE code = 'CS306' AND university_id = taylor_id;
  
  -- Insert CS305 (Cloud Computing) for Taylor
  INSERT INTO course_module (code, name, credits, semester_offered, prerequisites, description, university_id)
  VALUES ('CS305', 'Cloud Computing', 3, '[1, 2]', '[]', 'Introduction to cloud platforms, services, and deployment strategies.', taylor_id)
  ON CONFLICT (code, university_id) DO NOTHING
  RETURNING id INTO cs305_id;
  
  IF cs305_id IS NULL THEN
    SELECT id INTO cs305_id FROM course_module WHERE code = 'CS305' AND university_id = taylor_id;
  END IF;
  
  -- Add CS307 (Blockchain Technology)
  INSERT INTO course_module (code, name, credits, semester_offered, prerequisites, description, university_id)
  VALUES ('CS307', 'Blockchain Technology', 3, '[1, 2]', '[]', 'Introduction to blockchain, cryptocurrencies, and decentralized applications.', taylor_id)
  ON CONFLICT (code, university_id) DO NOTHING
  RETURNING id INTO cs307_id;
  
  IF cs307_id IS NULL THEN
    SELECT id INTO cs307_id FROM course_module WHERE code = 'CS307' AND university_id = taylor_id;
  END IF;
  
  -- Remove all existing elective entries to avoid duplicates
  DELETE FROM course_structure 
  WHERE degree_program_id = taylor_cs_id 
    AND is_core = false;
  
  -- Add electives properly
  IF cs305_id IS NOT NULL THEN
    INSERT INTO course_structure (degree_program_id, course_id, is_core, recommended_year, recommended_semester)
    VALUES (taylor_cs_id, cs305_id, false, 3, 2);
  END IF;
  
  IF cs306_id IS NOT NULL THEN
    INSERT INTO course_structure (degree_program_id, course_id, is_core, recommended_year, recommended_semester)
    VALUES (taylor_cs_id, cs306_id, false, 4, 1);
  END IF;
  
  IF cs307_id IS NOT NULL THEN
    INSERT INTO course_structure (degree_program_id, course_id, is_core, recommended_year, recommended_semester)
    VALUES (taylor_cs_id, cs307_id, false, 4, 1);
  END IF;
END $$;
