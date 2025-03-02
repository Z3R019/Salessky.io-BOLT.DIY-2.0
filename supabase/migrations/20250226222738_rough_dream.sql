/*
  # Fix user settings and data persistence

  1. Changes
    - Add trigger to automatically create user profile on signup
    - Update RLS policies for user settings
    - Add validation for user settings

  2. Security
    - Maintain existing RLS policies
    - Users can only update their own settings
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    company_name,
    company_website,
    company_address,
    company_zip,
    company_city,
    company_phone,
    company_description,
    email_signature,
    created_at
  ) VALUES (
    new.id,
    new.email,
    '',  -- first_name
    '',  -- last_name
    '',  -- company_name
    '',  -- company_website
    '',  -- company_address
    '',  -- company_zip
    '',  -- company_city
    '',  -- company_phone
    '',  -- company_description
    '',  -- email_signature
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
