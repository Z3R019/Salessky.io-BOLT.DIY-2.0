-- Add SMTP and IMAP fields to email_accounts table
ALTER TABLE IF EXISTS public.email_accounts 
ADD COLUMN IF NOT EXISTS smtp_host text,
ADD COLUMN IF NOT EXISTS smtp_port integer,
ADD COLUMN IF NOT EXISTS smtp_username text,
ADD COLUMN IF NOT EXISTS smtp_password text,
ADD COLUMN IF NOT EXISTS smtp_security text,
ADD COLUMN IF NOT EXISTS imap_host text,
ADD COLUMN IF NOT EXISTS imap_port integer,
ADD COLUMN IF NOT EXISTS imap_username text,
ADD COLUMN IF NOT EXISTS imap_password text,
ADD COLUMN IF NOT EXISTS imap_security text,
ADD COLUMN IF NOT EXISTS provider_logo text,
ADD COLUMN IF NOT EXISTS provider_type text;

-- Update schema cache
SELECT pg_notify('pgrst', 'reload schema');
