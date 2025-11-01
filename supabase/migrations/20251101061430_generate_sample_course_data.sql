/*
  # Generate Sample Course Data and Link Units

  1. Changes
    - Link course_module (degree programs) with units (actual classes)
    - Create realistic course structures for each university
    - Generate sample course plans for testing

  2. Universities
    - Taylor: Computer Science program
    - Sunway: Software Engineering program
    - Monash: Data Science program

  3. Security
    - All data follows existing RLS policies
*/

-- Link Taylor CS modules to their units
DO $$
DECLARE
  taylor_id uuid;
  cs101_id uuid;
  cs102_id uuid;
  cs201_id uuid;
  cs204_id uuid;
  cs302_id uuid;
  cs303_id uuid;
  cs304_id uuid;
  cs401_id uuid;
  cit2214_id uuid;
  cit2215_id uuid;
  cit3009_id uuid;
  cit3623_id uuid;
BEGIN
  SELECT id INTO taylor_id FROM universities WHERE code = 'TAYLOR';
  SELECT id INTO cs101_id FROM course_module WHERE code = 'CS101' AND university_id = taylor_id;
  SELECT id INTO cs102_id FROM course_module WHERE code = 'CS102' AND university_id = taylor_id;
  SELECT id INTO cs201_id FROM course_module WHERE code = 'CS201' AND university_id = taylor_id;
  SELECT id INTO cs204_id FROM course_module WHERE code = 'CS204' AND university_id = taylor_id;
  SELECT id INTO cs302_id FROM course_module WHERE code = 'CS302' AND university_id = taylor_id;
  SELECT id INTO cs303_id FROM course_module WHERE code = 'CS303' AND university_id = taylor_id;
  SELECT id INTO cs304_id FROM course_module WHERE code = 'CS304' AND university_id = taylor_id;
  SELECT id INTO cs401_id FROM course_module WHERE code = 'CS401' AND university_id = taylor_id;

  -- Get some Taylor units
  SELECT id INTO cit2214_id FROM units WHERE code = 'CIT2214' AND university_id = taylor_id;
  SELECT id INTO cit2215_id FROM units WHERE code = 'CIT2215' AND university_id = taylor_id;
  SELECT id INTO cit3009_id FROM units WHERE code = 'CIT3009' AND university_id = taylor_id;
  SELECT id INTO cit3623_id FROM units WHERE code = 'CIT3623' AND university_id = taylor_id;

  -- Link CS101 (Intro to Programming) to relevant units
  IF cs101_id IS NOT NULL AND cit2214_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs101_id, cit2214_id, true, 1, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS102 (Data Structures) to relevant units
  IF cs102_id IS NOT NULL AND cit2215_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs102_id, cit2215_id, true, 1, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS201 (Database Systems) to relevant units
  IF cs201_id IS NOT NULL AND cit3009_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs201_id, cit3009_id, true, 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link CS302 (AI) to relevant units
  IF cs302_id IS NOT NULL AND cit3623_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs302_id, cit3623_id, true, 3, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Link Sunway modules to units
DO $$
DECLARE
  sunway_id uuid;
  cs202_id uuid;
  cs203_id uuid;
  cs301_id uuid;
  cs305_id uuid;
  eng101_id uuid;
  eng201_id uuid;
  comp1001_id uuid;
  comp1002_id uuid;
  comp2001_id uuid;
  comp2002_id uuid;
BEGIN
  SELECT id INTO sunway_id FROM universities WHERE code = 'SUNWAY';
  SELECT id INTO cs202_id FROM course_module WHERE code = 'CS202' AND university_id = sunway_id;
  SELECT id INTO cs203_id FROM course_module WHERE code = 'CS203' AND university_id = sunway_id;
  SELECT id INTO cs301_id FROM course_module WHERE code = 'CS301' AND university_id = sunway_id;
  SELECT id INTO cs305_id FROM course_module WHERE code = 'CS305' AND university_id = sunway_id;
  SELECT id INTO eng101_id FROM course_module WHERE code = 'ENG101' AND university_id = sunway_id;
  SELECT id INTO eng201_id FROM course_module WHERE code = 'ENG201' AND university_id = sunway_id;

  SELECT id INTO comp1001_id FROM units WHERE code = 'COMP1001' AND university_id = sunway_id;
  SELECT id INTO comp1002_id FROM units WHERE code = 'COMP1002' AND university_id = sunway_id;
  SELECT id INTO comp2001_id FROM units WHERE code = 'COMP2001' AND university_id = sunway_id;
  SELECT id INTO comp2002_id FROM units WHERE code = 'COMP2002' AND university_id = sunway_id;

  -- Link modules to units
  IF cs202_id IS NOT NULL AND comp2001_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs202_id, comp2001_id, true, 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF cs301_id IS NOT NULL AND comp2002_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (cs301_id, comp2002_id, true, 2, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  IF eng101_id IS NOT NULL AND comp1001_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (eng101_id, comp1001_id, true, 1, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Link Monash modules to units
DO $$
DECLARE
  monash_id uuid;
  math101_id uuid;
  math201_id uuid;
  math202_id uuid;
  math203_id uuid;
  phy101_id uuid;
  phy102_id uuid;
  fit1045_id uuid;
  fit2004_id uuid;
  fit2094_id uuid;
  fit3143_id uuid;
  mat1830_id uuid;
BEGIN
  SELECT id INTO monash_id FROM universities WHERE code = 'MONASH';
  SELECT id INTO math101_id FROM course_module WHERE code = 'MATH101' AND university_id = monash_id;
  SELECT id INTO math201_id FROM course_module WHERE code = 'MATH201' AND university_id = monash_id;
  SELECT id INTO math202_id FROM course_module WHERE code = 'MATH202' AND university_id = monash_id;
  SELECT id INTO math203_id FROM course_module WHERE code = 'MATH203' AND university_id = monash_id;
  SELECT id INTO phy101_id FROM course_module WHERE code = 'PHY101' AND university_id = monash_id;
  SELECT id INTO phy102_id FROM course_module WHERE code = 'PHY102' AND university_id = monash_id;

  SELECT id INTO fit1045_id FROM units WHERE code = 'FIT1045' AND university_id = monash_id;
  SELECT id INTO fit2004_id FROM units WHERE code = 'FIT2004' AND university_id = monash_id;
  SELECT id INTO fit2094_id FROM units WHERE code = 'FIT2094' AND university_id = monash_id;
  SELECT id INTO fit3143_id FROM units WHERE code = 'FIT3143' AND university_id = monash_id;
  SELECT id INTO mat1830_id FROM units WHERE code = 'MAT1830' AND university_id = monash_id;

  -- Link modules to units
  IF math101_id IS NOT NULL AND fit1045_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (math101_id, fit1045_id, true, 1, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF math201_id IS NOT NULL AND fit2004_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (math201_id, fit2004_id, true, 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF math202_id IS NOT NULL AND fit2094_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (math202_id, fit2094_id, true, 2, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF math203_id IS NOT NULL AND mat1830_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (math203_id, mat1830_id, true, 1, 2)
    ON CONFLICT DO NOTHING;
  END IF;

  IF phy101_id IS NOT NULL AND fit3143_id IS NOT NULL THEN
    INSERT INTO course (course_id, unit_id, is_core, recommended_year, recommended_semester)
    VALUES (phy101_id, fit3143_id, false, 3, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
