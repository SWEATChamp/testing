/*
  # Link Taylor Course Modules to Units

  1. Changes
    - Link Taylor course_module entries (CS101 program module) to units table (CS101 actual class)
    - Create proper course structure for Taylor

  2. Security
    - Follows existing RLS policies
*/

-- Link Taylor course modules to units
DO $$
DECLARE
  taylor_id uuid;
  cs101_module_id uuid;
  cs102_module_id uuid;
  cs201_module_id uuid;
  cs204_module_id uuid;
  cs302_module_id uuid;
  cs303_module_id uuid;
  cs304_module_id uuid;
  cs401_module_id uuid;
  
  cs101_unit_id uuid;
  cs102_unit_id uuid;
  cs201_unit_id uuid;
  cs202_unit_id uuid;
  cs301_unit_id uuid;
  cs302_unit_id uuid;
  math101_unit_id uuid;
BEGIN
  SELECT id INTO taylor_id FROM universities WHERE code = 'TAYLOR';
  
  -- Get course_module IDs
  SELECT id INTO cs101_module_id FROM course_module WHERE code = 'CS101' AND university_id = taylor_id;
  SELECT id INTO cs102_module_id FROM course_module WHERE code = 'CS102' AND university_id = taylor_id;
  SELECT id INTO cs201_module_id FROM course_module WHERE code = 'CS201' AND university_id = taylor_id;
  SELECT id INTO cs204_module_id FROM course_module WHERE code = 'CS204' AND university_id = taylor_id;
  SELECT id INTO cs302_module_id FROM course_module WHERE code = 'CS302' AND university_id = taylor_id;
  SELECT id INTO cs303_module_id FROM course_module WHERE code = 'CS303' AND university_id = taylor_id;
  SELECT id INTO cs304_module_id FROM course_module WHERE code = 'CS304' AND university_id = taylor_id;
  SELECT id INTO cs401_module_id FROM course_module WHERE code = 'CS401' AND university_id = taylor_id;

  -- Get unit IDs from units table
  SELECT id INTO cs101_unit_id FROM units WHERE code = 'CS101' AND university_id = taylor_id;
  SELECT id INTO cs102_unit_id FROM units WHERE code = 'CS102' AND university_id = taylor_id;
  SELECT id INTO cs201_unit_id FROM units WHERE code = 'CS201' AND university_id = taylor_id;
  SELECT id INTO cs202_unit_id FROM units WHERE code = 'CS202' AND university_id = taylor_id;
  SELECT id INTO cs301_unit_id FROM units WHERE code = 'CS301' AND university_id = taylor_id;
  SELECT id INTO cs302_unit_id FROM units WHERE code = 'CS302' AND university_id = taylor_id;
  SELECT id INTO math101_unit_id FROM units WHERE code = 'MATH101' AND university_id = taylor_id;

  -- Link CS101 module (Intro to Programming) to CS101 unit
  IF cs101_module_id IS NOT NULL AND cs101_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs101_module_id, cs101_unit_id, true, 1, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS102 module (Data Structures) to CS102 unit
  IF cs102_module_id IS NOT NULL AND cs102_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs102_module_id, cs102_unit_id, true, 1, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS201 module (Database Systems) to CS202 unit
  IF cs201_module_id IS NOT NULL AND cs202_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs201_module_id, cs202_unit_id, true, 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS204 module (Operating Systems) to CS201 unit (OOP)
  IF cs204_module_id IS NOT NULL AND cs201_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs204_module_id, cs201_unit_id, true, 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS302 module (AI) to CS301 unit (Web Dev)
  IF cs302_module_id IS NOT NULL AND cs301_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs302_module_id, cs301_unit_id, true, 3, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS303 module (Machine Learning) to CS302 unit (Mobile App Dev)
  IF cs303_module_id IS NOT NULL AND cs302_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs303_module_id, cs302_unit_id, true, 3, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS304 module (Data Mining) to MATH101 unit
  IF cs304_module_id IS NOT NULL AND math101_unit_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs304_module_id, math101_unit_id, true, 1, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
