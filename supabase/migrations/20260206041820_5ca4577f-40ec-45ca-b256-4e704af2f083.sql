-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restricted SELECT policy
-- Users can always see their own profile
-- Employees and admins can see all employee/admin profiles (needed for task assignment, etc.)
-- Customers can only see their own profile
CREATE POLICY "Role-based profile visibility"
ON public.profiles FOR SELECT TO authenticated
USING (
  -- Everyone can see their own profile
  id = auth.uid()
  OR
  -- Admins can see all profiles
  public.is_admin(auth.uid())
  OR
  -- Employees can see other employee profiles (not customer profiles)
  (
    public.is_employee(auth.uid()) 
    AND login_type IN ('employee', 'admin')
  )
  OR
  -- Customers can see their assigned PM's profile (via leads table)
  (
    public.is_customer(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.customer_id = auth.uid()
      AND leads.assigned_pm = profiles.id
    )
  )
);