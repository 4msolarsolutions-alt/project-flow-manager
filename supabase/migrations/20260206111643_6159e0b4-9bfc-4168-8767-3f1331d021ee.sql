-- Fix profiles table: Ensure strict authentication requirement
-- Drop existing policy and recreate with explicit auth check
DROP POLICY IF EXISTS "Role-based profile visibility" ON public.profiles;

CREATE POLICY "Role-based profile visibility" ON public.profiles
FOR SELECT
TO authenticated  -- Only authenticated users can access
USING (
  (id = auth.uid()) OR 
  is_admin(auth.uid()) OR 
  (is_employee(auth.uid()) AND (login_type = ANY (ARRAY['employee'::login_type, 'admin'::login_type]))) OR 
  (is_customer(auth.uid()) AND (EXISTS (
    SELECT 1 FROM leads
    WHERE leads.customer_id = auth.uid() AND leads.assigned_pm = profiles.id
  )))
);

-- Fix quotations table: Add explicit authentication requirement
DROP POLICY IF EXISTS "View quotations" ON public.quotations;

CREATE POLICY "View quotations" ON public.quotations
FOR SELECT
TO authenticated  -- Only authenticated users can access
USING (
  is_admin(auth.uid()) OR 
  (prepared_by = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = quotations.lead_id 
    AND (leads.assigned_pm = auth.uid() OR leads.customer_id = auth.uid())
  ))
);