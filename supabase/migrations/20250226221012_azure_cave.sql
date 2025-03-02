/*
  # Initial Schema for SalesSky

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `email_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `email` (text)
      - `name` (text)
      - `provider` (text)
      - `status` (text)
      - `created_at` (timestamp)
    - `lead_groups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `created_at` (timestamp)
      - `archived` (boolean)
    - `leads`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to lead_groups)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `company` (text)
      - `position` (text)
      - `created_at` (timestamp)
    - `campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `status` (text)
      - `account_id` (uuid, foreign key to email_accounts)
      - `group_id` (uuid, foreign key to lead_groups)
      - `template_prompt` (text)
      - `ai_model` (text)
      - `scheduled_for` (timestamp)
      - `created_at` (timestamp)
    - `campaign_emails`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `lead_id` (uuid, foreign key to leads)
      - `subject` (text)
      - `content` (text)
      - `status` (text)
      - `sent_at` (timestamp)
      - `opened_at` (timestamp)
      - `clicked_at` (timestamp)
      - `approved` (boolean)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create email_accounts table
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create lead_groups table
CREATE TABLE IF NOT EXISTS lead_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  archived boolean DEFAULT false
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES lead_groups(id) ON DELETE CASCADE NOT NULL,
  first_name text,
  last_name text,
  email text NOT NULL,
  company text,
  position text,
  created_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
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

-- Create campaign_emails table
CREATE TABLE IF NOT EXISTS campaign_emails (
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Email accounts policies
CREATE POLICY "Users can CRUD own email accounts"
  ON email_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Lead groups policies
CREATE POLICY "Users can CRUD own lead groups"
  ON lead_groups
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Leads policies
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
CREATE POLICY "Users can CRUD own campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Campaign emails policies
CREATE POLICY "Users can CRUD own campaign emails"
  ON campaign_emails
  FOR ALL
  TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Create trigger to create a user record when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
