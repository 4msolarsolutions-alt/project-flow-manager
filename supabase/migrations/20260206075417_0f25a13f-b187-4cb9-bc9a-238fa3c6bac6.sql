-- Drop the existing policy and create a new one that explicitly checks for authentication
DROP POLICY IF EXISTS "Role-based profile visibility" ON public.profiles;

-- Create updated policy that explicitly requires authentication
CREATE POLICY "Role-based profile visibility" 
ON public.profiles 
FOR SELECT 
USING (
  -- Must be authenticated first
  auth.uid() IS NOT NULL
  AND (
    -- Users can see their own profile
    (id = auth.uid()) 
    -- Admins can see all profiles
    OR is_admin(auth.uid()) 
    -- Employees can see other employees/admins (for team directory)
    OR (is_employee(auth.uid()) AND (login_type = ANY (ARRAY['employee'::login_type, 'admin'::login_type]))) 
    -- Customers can only see their assigned PM
    OR (is_customer(auth.uid()) AND (EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.customer_id = auth.uid() 
      AND leads.assigned_pm = profiles.id
    )))
  )
);