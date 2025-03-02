/*
  # Fix schema constraints

  1. Changes
    - Add NOT NULL constraints to required fields
    - Add default values where appropriate
    - Add validation checks for email format
    - Add validation for status values

  2. Security
    - Maintain existing RLS policies
*/

-- Add NOT NULL constraints and validation checks for campaigns
ALTER TABLE campaigns ALTER COLUMN name SET NOT NULL;
ALTER TABLE campaigns ALTER COLUMN status SET NOT NULL;
ALTER TABLE campaigns ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check 
  CHECK (status IN ('draft', 'scheduled', 'running', 'completed'));

-- Add NOT NULL constraints and validation checks for email_accounts
ALTER TABLE email_accounts ALTER COLUMN email SET NOT NULL;
ALTER TABLE email_accounts ALTER COLUMN name SET NOT NULL;
ALTER TABLE email_accounts ALTER COLUMN provider SET NOT NULL;
ALTER TABLE email_accounts ALTER COLUMN status SET NOT NULL;
ALTER TABLE email_accounts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE email_accounts ADD CONSTRAINT email_accounts_status_check 
  CHECK (status IN ('pending', 'active', 'inactive'));
ALTER TABLE email_accounts ADD CONSTRAINT email_accounts_email_check 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add NOT NULL constraints and default values for lead_groups
ALTER TABLE lead_groups ALTER COLUMN name SET NOT NULL;
ALTER TABLE lead_groups ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE lead_groups ALTER COLUMN archived SET DEFAULT false;
ALTER TABLE lead_groups ALTER COLUMN archived SET NOT NULL;

-- Add NOT NULL constraints and validation checks for leads
ALTER TABLE leads ALTER COLUMN email SET NOT NULL;
ALTER TABLE leads ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE leads ADD CONSTRAINT leads_email_check 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add NOT NULL constraints and default values for campaign_emails
ALTER TABLE campaign_emails ALTER COLUMN campaign_id SET NOT NULL;
ALTER TABLE campaign_emails ALTER COLUMN lead_id SET NOT NULL;
ALTER TABLE campaign_emails ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE campaign_emails ALTER COLUMN status SET NOT NULL;
ALTER TABLE campaign_emails ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE campaign_emails ALTER COLUMN approved SET NOT NULL;
ALTER TABLE campaign_emails ADD CONSTRAINT campaign_emails_status_check 
  CHECK (status IN ('draft', 'pending', 'sent', 'failed'));
