-- Add custom_fields to leads table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN custom_fields JSONB;
  END IF;
END
$$;

-- Update schema cache
SELECT pg_notify('pgrst', 'reload schema');
