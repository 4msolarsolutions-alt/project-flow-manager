-- Add RLS policy for customers to view their project payments
CREATE POLICY "Customers can view their project payments"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN leads l ON l.id = p.lead_id
    WHERE p.id = payments.project_id
    AND l.customer_id = auth.uid()
  )
);