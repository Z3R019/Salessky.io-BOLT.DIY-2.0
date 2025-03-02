-- Add column_mappings to lead_groups
ALTER TABLE "public"."lead_groups" 
ADD COLUMN "column_mappings" JSONB;

-- Add custom_fields to leads
ALTER TABLE "public"."leads" 
ADD COLUMN "custom_fields" JSONB DEFAULT '{}'::jsonb;

-- Create a view for leads with custom fields
CREATE OR REPLACE VIEW "public"."leads_with_fields" AS
SELECT 
  l.id,
  l.group_id,
  l.email,
  l.first_name,
  l.last_name,
  l.company,
  l.position,
  l.created_at,
  l.custom_fields,
  g.column_mappings
FROM 
  "public"."leads" l
JOIN
  "public"."lead_groups" g ON l.group_id = g.id;

COMMENT ON VIEW "public"."leads_with_fields" IS 'View for leads with custom fields and column mappings';
