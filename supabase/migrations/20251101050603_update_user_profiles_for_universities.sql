/*
  # Update User Profiles for University Selection

  1. Changes
    - Add `university_id` column to user_profiles
    - Keep existing `university` text field for backward compatibility
    - Set default university for existing users

  2. Notes
    - Existing users will be assigned to Taylor University by default
    - New users must select their university during registration
*/

-- Add university_id to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'university_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN university_id uuid REFERENCES universities(id);
  END IF;
END $$;

-- Update existing users to Taylor University
UPDATE user_profiles
SET university_id = (SELECT id FROM universities WHERE code = 'TAYLOR')
WHERE university_id IS NULL;
