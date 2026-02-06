-- Drop the existing policy and create a new one that includes customers
DROP POLICY IF EXISTS "View projects" ON public.projects;

-- Create updated policy that allows customers to view their projects
CREATE POLICY "View projects" 
ON public.projects 
FOR SELECT 
USING (
  is_admin(auth.uid()) 
  OR (pm_id = auth.uid()) 
  OR is_employee(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = projects.lead_id
    AND leads.customer_id = auth.uid()
  )
);