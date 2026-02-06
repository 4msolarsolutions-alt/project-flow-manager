-- Create payroll table
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  total_hours NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  base_salary NUMERIC GENERATED ALWAYS AS (total_hours * hourly_rate) STORED,
  expense_reimbursement NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  total_payable NUMERIC GENERATED ALWAYS AS ((total_hours * hourly_rate) + expense_reimbursement - deductions) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'approved', 'paid')),
  generated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees can view their own payroll, admins/accounts can view all
CREATE POLICY "View payroll"
ON public.payroll
FOR SELECT
USING (
  is_admin(auth.uid()) 
  OR is_accounts(auth.uid())
  OR user_id = auth.uid()
);

-- Only admin/accounts can create payroll
CREATE POLICY "Create payroll"
ON public.payroll
FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR is_accounts(auth.uid()));

-- Only admin/accounts can update payroll
CREATE POLICY "Update payroll"
ON public.payroll
FOR UPDATE
USING (is_admin(auth.uid()) OR is_accounts(auth.uid()));

-- Only admin can delete payroll
CREATE POLICY "Delete payroll"
ON public.payroll
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_payroll_updated_at
BEFORE UPDATE ON public.payroll
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_payroll_user ON public.payroll(user_id);
CREATE INDEX idx_payroll_period ON public.payroll(year, month);
CREATE INDEX idx_payroll_status ON public.payroll(status);

-- Add hourly_rate column to profiles for employee rate tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;