-- Add openai_api_key field to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'openai_api_key'
  ) THEN
    ALTER TABLE public.users ADD COLUMN openai_api_key TEXT;
  END IF;
END
$$;

-- Ensure RLS policies are set up correctly for the users table
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can see their own data'
  ) THEN
    CREATE POLICY "Users can see their own data" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END
$$;

-- Create policy to allow users to update only their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END
$$;

-- Create policy to allow users to insert only their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can insert own data'
  ) THEN
    CREATE POLICY "Users can insert own data" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
