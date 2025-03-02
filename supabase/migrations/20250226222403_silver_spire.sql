/*
  # Add User Settings

  1. New Columns
    - Add company settings columns to users table
      - company_name (text)
      - company_website (text)
      - company_address (text)
      - company_zip (text)
      - company_city (text)
      - company_phone (text)
      - company_description (text)
      - email_signature (text)
      - first_name (text)
      - last_name (text)

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_website text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_address text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_zip text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_city text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_description text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_signature text;
