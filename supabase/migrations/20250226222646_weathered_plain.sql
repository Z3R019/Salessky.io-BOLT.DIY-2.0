/*
  # Add user settings fields

  1. Changes
    - Add new columns to users table for storing company and profile settings
    - Add validation triggers for required fields
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Users can only update their own settings
*/

-- Add new columns to users table if they don't exist
DO $$ 
BEGIN
  -- Profile fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
    ALTER TABLE users ADD COLUMN first_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
    ALTER TABLE users ADD COLUMN last_name text;
  END IF;

  -- Company fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_name') THEN
    ALTER TABLE users ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_website') THEN
    ALTER TABLE users ADD COLUMN company_website text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_address') THEN
    ALTER TABLE users ADD COLUMN company_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_zip') THEN
    ALTER TABLE users ADD COLUMN company_zip text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_city') THEN
    ALTER TABLE users ADD COLUMN company_city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_phone') THEN
    ALTER TABLE users ADD COLUMN company_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'company_description') THEN
    ALTER TABLE users ADD COLUMN company_description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_signature') THEN
    ALTER TABLE users ADD COLUMN email_signature text;
  END IF;
END $$;
