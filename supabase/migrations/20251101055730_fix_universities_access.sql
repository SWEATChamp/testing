/*
  # Fix Universities Access for Signup

  1. Changes
    - Update universities RLS policy to allow anonymous access for signup
    - This is safe as universities table is read-only reference data

  2. Security
    - Only SELECT is allowed
    - No INSERT, UPDATE, or DELETE permissions for anyone
*/

-- Drop old policy and create new one that allows anonymous access
DROP POLICY IF EXISTS "Anyone can view universities" ON universities;

CREATE POLICY "Everyone can view universities"
  ON universities FOR SELECT
  TO anon, authenticated
  USING (true);
