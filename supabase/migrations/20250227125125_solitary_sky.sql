-- Create a function to ensure all required tables exist
CREATE OR REPLACE FUNCTION ensure_tables_exist() RETURNS void AS $$
BEGIN
  -- Create users table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      first_name text DEFAULT '',
      last_name text DEFAULT '',
      company_name text DEFAULT '',
      company_website text DEFAULT '',
      company_address text DEFAULT '',
      company_zip text DEFAULT '',
      company_city text DEFAULT '',
      company_phone text DEFAULT '',
      company_description text DEFAULT '',
      email_signature text DEFAULT '',
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create email_accounts table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_accounts') THEN
    CREATE TABLE email_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      email text NOT NULL,
      name text NOT NULL,
      provider text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create lead_groups table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lead_groups') THEN
    CREATE TABLE lead_groups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      name text NOT NULL,
      created_at timestamptz DEFAULT now(),
      archived boolean DEFAULT false
    );
  END IF;

  -- Create leads table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leads') THEN
    CREATE TABLE leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id uuid REFERENCES lead_groups(id) ON DELETE CASCADE NOT NULL,
      first_name text,
      last_name text,
      email text NOT NULL,
      company text,
      position text,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create campaigns table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'campaigns') THEN
    CREATE TABLE campaigns (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      name text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      account_id uuid REFERENCES email_accounts(id) ON DELETE SET NULL,
      group_id uuid REFERENCES lead_groups(id) ON DELETE SET NULL,
      template_prompt text,
      ai_model text,
      scheduled_for timestamptz,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create campaign_emails table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'campaign_emails') THEN
    CREATE TABLE campaign_emails (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
      lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
      subject text,
      content text,
      status text DEFAULT 'draft',
      sent_at timestamptz,
      opened_at timestamptz,
      clicked_at timestamptz,
      approved boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Create email_templates table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'email_templates') THEN
    CREATE TABLE email_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      name text NOT NULL,
      subject text,
      content text,
      variables text[],
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to ensure all tables exist
SELECT ensure_tables_exist();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create or replace all RLS policies
-- Users policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  CREATE POLICY "Users can read own data"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can insert own data" ON users;
  CREATE POLICY "Users can insert own data"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own data" ON users;
  CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- Email accounts policies
  DROP POLICY IF EXISTS "Users can CRUD own email accounts" ON email_accounts;
  CREATE POLICY "Users can CRUD own email accounts"
    ON email_accounts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

  -- Lead groups policies
  DROP POLICY IF EXISTS "Users can CRUD own lead groups" ON lead_groups;
  CREATE POLICY "Users can CRUD own lead groups"
    ON lead_groups
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

  -- Leads policies
  DROP POLICY IF EXISTS "Users can CRUD own leads" ON leads;
  CREATE POLICY "Users can CRUD own leads"
    ON leads
    FOR ALL
    TO authenticated
    USING (
      group_id IN (
        SELECT id FROM lead_groups WHERE user_id = auth.uid()
      )
    );

  -- Campaigns policies
  DROP POLICY IF EXISTS "Users can CRUD own campaigns" ON campaigns;
  CREATE POLICY "Users can CRUD own campaigns"
    ON campaigns
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

  -- Campaign emails policies
  DROP POLICY IF EXISTS "Users can CRUD own campaign emails" ON campaign_emails;
  CREATE POLICY "Users can CRUD own campaign emails"
    ON campaign_emails
    FOR ALL
    TO authenticated
    USING (
      campaign_id IN (
        SELECT id FROM campaigns WHERE user_id = auth.uid()
      )
    );

  -- Email templates policies
  DROP POLICY IF EXISTS "Users can manage their own templates" ON email_templates;
  CREATE POLICY "Users can manage their own templates"
    ON email_templates
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);
END
$$;

-- Create or replace the user creation trigger
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
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_group_id ON leads(group_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_lead_id ON campaign_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_emails_status ON campaign_emails(status);
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_groups_user_id ON lead_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_groups_archived ON lead_groups(archived);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
