-- Create openai_assistants table to store assistant information
CREATE TABLE IF NOT EXISTS public.openai_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  model TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for openai_assistants
ALTER TABLE public.openai_assistants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read assistant data
CREATE POLICY "Anyone can view assistants" 
  ON public.openai_assistants 
  FOR SELECT 
  USING (true);

-- Only allow admins to modify assistant data
CREATE POLICY "Only admins can insert assistants"
  ON public.openai_assistants
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

CREATE POLICY "Only admins can update assistants"
  ON public.openai_assistants
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ))
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

CREATE POLICY "Only admins can delete assistants"
  ON public.openai_assistants
  FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

-- Create a secure function to store the API key in the database
-- This will only be accessible via RLS with proper authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Secure the api_keys table with RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can see, add, update or delete api keys
CREATE POLICY "Only admins can select api_keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

CREATE POLICY "Only admins can insert api_keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

CREATE POLICY "Only admins can update api_keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ))
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

CREATE POLICY "Only admins can delete api_keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM public.users WHERE is_admin = true
  ));

-- Insert sample data for development
INSERT INTO public.openai_assistants (assistant_id, name, description, model, capabilities, icon, is_active)
VALUES
  ('asst_sales', 'Sales Assistant', 'Spezialisiert auf Vertriebskommunikation und Angebote', 'gpt-4', ARRAY['Personalisierte Verkaufsansprache', 'Angebotsvorschläge', 'Nachfass-Emails'], 'shopping_cart', true),
  ('asst_marketing', 'Marketing Assistant', 'Erstellt Marketing-Materialien und Kampagnen', 'gpt-4', ARRAY['Newsletter', 'Produktbeschreibungen', 'Marketing-Kampagnen'], 'campaign', true),
  ('asst_support', 'Kundenservice Assistant', 'Hilfreich für Kundensupport und Anfragenbeantwortung', 'gpt-3.5-turbo', ARRAY['Anfragenbeantwortung', 'Problembehebung', 'FAQ-Erstellung'], 'support_agent', true),
  ('asst_recruiter', 'Recruiting Assistant', 'Optimiert für Personalgewinnung und Kandidatenkommunikation', 'gpt-4', ARRAY['Stellenangebote', 'Kandidatenansprache', 'Bewerbungsprozess'], 'person_search', true);
