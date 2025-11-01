/*
  # Unit Arrangement System

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text) - Course name (e.g., "Bachelor of Computer Science")
      - `code` (text) - Course code (e.g., "BSCS")
      - `total_credits` (integer) - Total credits required
      - `duration_years` (integer) - Course duration in years
      - `created_at` (timestamptz)
    
    - `units`
      - `id` (uuid, primary key)
      - `code` (text) - Unit code (e.g., "CS101")
      - `name` (text) - Unit name
      - `credits` (integer) - Credit hours
      - `description` (text) - Unit description
      - `is_elective` (boolean) - Whether this is an elective unit
      - `semester_offered` (text[]) - Semesters when offered (e.g., ["1", "2", "summer"])
      - `created_at` (timestamptz)
    
    - `unit_prerequisites`
      - `id` (uuid, primary key)
      - `unit_id` (uuid, foreign key to units)
      - `prerequisite_id` (uuid, foreign key to units)
      - `created_at` (timestamptz)
    
    - `course_units`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `unit_id` (uuid, foreign key to units)
      - `is_core` (boolean) - Whether this is a core unit
      - `recommended_year` (integer) - Recommended year to take
      - `recommended_semester` (integer) - Recommended semester to take
      - `created_at` (timestamptz)
    
    - `user_course_maps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `course_id` (uuid, foreign key to courses)
      - `intake` (text) - Intake period (e.g., "2024-01")
      - `preferred_electives` (text[]) - Array of preferred elective areas
      - `overseas_program` (boolean) - Whether user wants overseas program
      - `ai_recommendation` (jsonb) - AI-generated course map
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read course/unit data
    - Add policies for users to manage their own course maps
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  total_credits integer NOT NULL DEFAULT 120,
  duration_years integer NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  credits integer NOT NULL DEFAULT 3,
  description text DEFAULT '',
  is_elective boolean DEFAULT false,
  semester_offered text[] DEFAULT ARRAY['1', '2'],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view units"
  ON units FOR SELECT
  TO authenticated
  USING (true);

-- Create unit_prerequisites table
CREATE TABLE IF NOT EXISTS unit_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  prerequisite_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, prerequisite_id)
);

ALTER TABLE unit_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view prerequisites"
  ON unit_prerequisites FOR SELECT
  TO authenticated
  USING (true);

-- Create course_units table
CREATE TABLE IF NOT EXISTS course_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  is_core boolean DEFAULT true,
  recommended_year integer NOT NULL DEFAULT 1,
  recommended_semester integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, unit_id)
);

ALTER TABLE course_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course units"
  ON course_units FOR SELECT
  TO authenticated
  USING (true);

-- Create user_course_maps table
CREATE TABLE IF NOT EXISTS user_course_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  intake text NOT NULL,
  preferred_electives text[] DEFAULT ARRAY[]::text[],
  overseas_program boolean DEFAULT false,
  ai_recommendation jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_course_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own course maps"
  ON user_course_maps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course maps"
  ON user_course_maps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course maps"
  ON user_course_maps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own course maps"
  ON user_course_maps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
