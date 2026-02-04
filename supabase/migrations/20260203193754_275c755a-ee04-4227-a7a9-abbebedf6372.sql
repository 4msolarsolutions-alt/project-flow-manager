-- Add missing fields to site_visits table for complete checklist
ALTER TABLE public.site_visits 
ADD COLUMN IF NOT EXISTS site_photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS roof_diagram_url TEXT,
ADD COLUMN IF NOT EXISTS customer_approval_panel BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_approval_inverter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_approval_cable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_approval_breaker BOOLEAN DEFAULT false;

-- Create storage bucket for site visit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-visits', 'site-visits', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for site visit photos
CREATE POLICY "Authenticated users can upload site visit photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-visits');

CREATE POLICY "Anyone can view site visit photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'site-visits');

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-visits');

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-visits');