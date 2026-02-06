-- Recreate the UPDATE policy that was dropped (simpler version)
-- The trigger function already exists and will handle validation

-- Policy for admin/accounts: full update access
CREATE POLICY "Admin and accounts can update any expense"
ON public.expenses FOR UPDATE TO authenticated
USING (
  public.is_admin(auth.uid()) OR public.is_accounts(auth.uid())
);

-- Policy for submitters: can only update their own PENDING expenses
-- The trigger provides additional validation to prevent self-approval
CREATE POLICY "Submitters can update own pending expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (
  submitted_by = auth.uid() AND status = 'pending'
);