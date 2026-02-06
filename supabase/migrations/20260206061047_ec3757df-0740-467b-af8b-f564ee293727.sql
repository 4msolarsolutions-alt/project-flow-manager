-- Add expense verification fields for admin verification workflow
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS bill_image_url TEXT,
ADD COLUMN IF NOT EXISTS verified_amount NUMERIC,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS expense_scope TEXT DEFAULT 'project' CHECK (expense_scope IN ('project', 'company'));

-- Create storage bucket for expense bills
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expense-bills', 'expense-bills', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for expense bills
CREATE POLICY "Employees can upload expense bills"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'expense-bills' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own expense bills"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'expense-bills' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR is_admin(auth.uid())
    OR is_accounts(auth.uid())
  )
);

CREATE POLICY "Admin and accounts can view all expense bills"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'expense-bills' 
  AND (is_admin(auth.uid()) OR is_accounts(auth.uid()))
);

-- Create a trigger to prevent self-approval of expenses
CREATE OR REPLACE FUNCTION public.prevent_expense_self_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If someone is trying to approve (change status to approved)
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Block if approver is the same as submitter
    IF NEW.approved_by = NEW.submitted_by THEN
      RAISE EXCEPTION 'You cannot approve your own expense';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for self-approval prevention
DROP TRIGGER IF EXISTS prevent_expense_self_approval_trigger ON public.expenses;
CREATE TRIGGER prevent_expense_self_approval_trigger
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_expense_self_approval();

-- Create a trigger to lock approved expenses from modification
CREATE OR REPLACE FUNCTION public.lock_approved_expenses()
RETURNS TRIGGER AS $$
BEGIN
  -- If expense was already approved, only allow admin to make changes
  IF OLD.status = 'approved' AND NOT is_admin(auth.uid()) THEN
    -- Only allow status changes by admin
    IF NEW.amount != OLD.amount 
       OR NEW.expense_type != OLD.expense_type 
       OR NEW.bill_image_url != OLD.bill_image_url 
       OR NEW.description != OLD.description THEN
      RAISE EXCEPTION 'Approved expenses cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for locking approved expenses
DROP TRIGGER IF EXISTS lock_approved_expenses_trigger ON public.expenses;
CREATE TRIGGER lock_approved_expenses_trigger
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_approved_expenses();