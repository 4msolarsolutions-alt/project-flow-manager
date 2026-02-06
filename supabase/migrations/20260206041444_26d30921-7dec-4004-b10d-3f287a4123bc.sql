-- Make the site-visits bucket private
UPDATE storage.buckets SET public = false WHERE id = 'site-visits';

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated uploads to site-visits" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from site-visits" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload site visit photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view site visit photos" ON storage.objects;

-- Create restrictive RLS policies based on lead ownership
-- Engineers assigned to the site visit can upload
CREATE POLICY "Engineers can upload site visit photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-visits' AND
  (
    -- Check if user is admin
    public.is_admin(auth.uid()) OR
    -- Check if user is an employee (can upload during site visits)
    public.is_employee(auth.uid())
  )
);

-- Only allow access to photos for authorized users
CREATE POLICY "Authorized users can view site visit photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'site-visits' AND
  (
    -- Admin can view all
    public.is_admin(auth.uid()) OR
    -- Project managers can view
    public.is_project_manager(auth.uid()) OR
    -- Engineer assigned to the site visit can view
    EXISTS (
      SELECT 1 FROM public.site_visits sv
      WHERE sv.engineer_id = auth.uid()
      AND (storage.foldername(name))[1] = sv.lead_id::text
    ) OR
    -- Lead creator or assigned PM can view
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE (l.created_by = auth.uid() OR l.assigned_pm = auth.uid())
      AND (storage.foldername(name))[1] = l.id::text
    )
  )
);

-- Only admin can delete photos
CREATE POLICY "Admin can delete site visit photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-visits' AND
  public.is_admin(auth.uid())
);