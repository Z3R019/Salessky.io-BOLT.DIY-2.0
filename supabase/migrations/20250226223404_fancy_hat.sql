/*
  # Fix Users Table RLS Policies

  1. Security Changes
    - Add INSERT policy for users table to allow authenticated users to create their own records
    - This is needed for the ensureUserRecord function to work properly

  The existing RLS policies only allow users to read and update their own records,
  but not create new ones. This migration adds the missing INSERT policy.
*/

-- Add policy for inserting records into users table
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
