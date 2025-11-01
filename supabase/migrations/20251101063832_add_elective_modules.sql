/*
  # Add Elective Course Modules

  1. New Modules
    - Add elective course modules for each university
    - Taylor: Advanced electives (CS305, CS306)
    - Sunway: Already has CS305 as elective
    - Monash: Already has PHY102 as elective

  2. Changes
    - Insert new elective modules for universities
    - Link electives to degree programs via course_structure
*/

DO $$
DECLARE
  taylor_id uuid;
  sunway_id uuid;
  monash_id uuid;
  
  taylor_cs_id uuid;
  sunway_se_id uuid;
  monash_ds_id uuid;
  
  cs305_id uuid;
  cs306_id uuid;
BEGIN
  -- Get university IDs
  SELECT id INTO taylor_id FROM universities WHERE code = 'TAYLOR';
  SELECT id INTO sunway_id FROM universities WHERE code = 'SUNWAY';
  SELECT id INTO monash_id FROM universities WHERE code = 'MONASH';
  
  -- Get degree program IDs
  SELECT id INTO taylor_cs_id FROM courses WHERE code = 'BCS' AND university_id = taylor_id;
  SELECT id INTO sunway_se_id FROM courses WHERE code = 'BSE' AND university_id = sunway_id;
  SELECT id INTO monash_ds_id FROM courses WHERE code = 'BDS' AND university_id = monash_id;
  
  -- Add electives for Taylor University
  INSERT INTO course_module (code, name, credits, semester_offered, prerequisites, description, university_id)
  VALUES 
    ('CS305', 'Cloud Computing', 3, '[1, 2]', '[]', 'Introduction to cloud platforms, services, and deployment strategies.', taylor_id),
    ('CS306', 'Cybersecurity', 3, '[1, 2]', '[]', 'Fundamentals of cybersecurity, encryption, and network security.', taylor_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO cs305_id;
  
  -- Get the IDs if they already existed
  IF cs305_id IS NULL THEN
    SELECT id INTO cs305_id FROM course_module WHERE code = 'CS305' AND university_id = taylor_id;
  END IF;
  
  SELECT id INTO cs306_id FROM course_module WHERE code = 'CS306' AND university_id = taylor_id;
  
  -- Link electives to Taylor's degree program
  IF cs305_id IS NOT NULL AND taylor_cs_id IS NOT NULL THEN
    INSERT INTO course_structure (degree_program_id, course_id, is_core, recommended_year, recommended_semester)
    VALUES (taylor_cs_id, cs305_id, false, 3, 2)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF cs306_id IS NOT NULL AND taylor_cs_id IS NOT NULL THEN
    INSERT INTO course_structure (degree_program_id, course_id, is_core, recommended_year, recommended_semester)
    VALUES (taylor_cs_id, cs306_id, false, 4, 1)
    ON CONFLICT DO NOTHING;
  END IF;
  
END $$;
