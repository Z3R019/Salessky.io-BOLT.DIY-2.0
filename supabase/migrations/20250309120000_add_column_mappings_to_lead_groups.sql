-- Add column_mappings to lead_groups table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_groups' 
    AND column_name = 'column_mappings'
  ) THEN
    ALTER TABLE public.lead_groups ADD COLUMN column_mappings JSONB;
  END IF;
END
$$;

-- Update schema cache
SELECT pg_notify('pgrst', 'reload schema');
