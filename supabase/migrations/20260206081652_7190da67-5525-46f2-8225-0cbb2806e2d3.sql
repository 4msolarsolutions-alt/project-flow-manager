-- Create project_stages table for tracking project timeline
CREATE TABLE public.project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, stage_order)
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  issue_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stage_change', 'payment', 'document', 'warranty', 'support', 'general')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create warranties table
CREATE TABLE public.warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  component_type TEXT NOT NULL CHECK (component_type IN ('panel', 'inverter', 'battery', 'workmanship')),
  brand_name TEXT,
  model_name TEXT,
  product_warranty_years INTEGER NOT NULL DEFAULT 0,
  performance_warranty_years INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  serial_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_stages
CREATE POLICY "Admins and PMs can manage project stages"
ON public.project_stages FOR ALL
USING (is_admin(auth.uid()) OR is_project_manager(auth.uid()));

CREATE POLICY "Employees can view project stages"
ON public.project_stages FOR SELECT
USING (is_employee(auth.uid()));

CREATE POLICY "Customers can view their project stages"
ON public.project_stages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  JOIN leads l ON l.id = p.lead_id
  WHERE p.id = project_stages.project_id
  AND l.customer_id = auth.uid()
));

-- RLS Policies for support_tickets
CREATE POLICY "Customers can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can view their own tickets"
ON public.support_tickets FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "Customers can update their own open tickets"
ON public.support_tickets FOR UPDATE
USING (customer_id = auth.uid() AND status = 'open');

CREATE POLICY "Admins and PMs can manage all tickets"
ON public.support_tickets FOR ALL
USING (is_admin(auth.uid()) OR is_project_manager(auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR is_project_manager(auth.uid()) OR is_employee(auth.uid()));

-- RLS Policies for warranties
CREATE POLICY "Admins and PMs can manage warranties"
ON public.warranties FOR ALL
USING (is_admin(auth.uid()) OR is_project_manager(auth.uid()));

CREATE POLICY "Employees can view warranties"
ON public.warranties FOR SELECT
USING (is_employee(auth.uid()));

CREATE POLICY "Customers can view their project warranties"
ON public.warranties FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  JOIN leads l ON l.id = p.lead_id
  WHERE p.id = warranties.project_id
  AND l.customer_id = auth.uid()
));

-- Add visible_to_customer column to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS visible_to_customer BOOLEAN DEFAULT false;

-- Update documents RLS to allow customers to view their documents
CREATE POLICY "Customers can view their visible documents"
ON public.documents FOR SELECT
USING (
  visible_to_customer = true 
  AND EXISTS (
    SELECT 1 FROM projects p
    JOIN leads l ON l.id = p.lead_id
    WHERE p.id = documents.project_id
    AND l.customer_id = auth.uid()
  )
);

-- Create function to auto-create project stages when project is created
CREATE OR REPLACE FUNCTION public.create_project_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_stages (project_id, stage_order, stage_name, stage_key, is_completed)
  VALUES
    (NEW.id, 1, 'Project Created', 'project_created', true),
    (NEW.id, 2, 'Site Visit Pending', 'site_visit_pending', false),
    (NEW.id, 3, 'Site Visit Completed', 'site_visit_completed', false),
    (NEW.id, 4, 'Quotation Sent', 'quotation_sent', false),
    (NEW.id, 5, 'Payment Pending', 'payment_pending', false),
    (NEW.id, 6, 'Material Ordered', 'material_ordered', false),
    (NEW.id, 7, 'Material Delivered', 'material_delivered', false),
    (NEW.id, 8, 'Installation Started', 'installation_started', false),
    (NEW.id, 9, 'Completed', 'completed', false),
    (NEW.id, 10, 'O&M Active', 'oam_active', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create stages
DROP TRIGGER IF EXISTS create_project_stages_trigger ON public.projects;
CREATE TRIGGER create_project_stages_trigger
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.create_project_stages();

-- Create function to auto-create warranties when project is completed
CREATE OR REPLACE FUNCTION public.create_project_warranties()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND NEW.stage_key = 'completed' AND OLD.is_completed = false THEN
    -- Create default warranties if they don't exist
    INSERT INTO public.warranties (project_id, component_type, product_warranty_years, performance_warranty_years, start_date)
    SELECT NEW.project_id, 'panel', 12, 25, CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM warranties WHERE project_id = NEW.project_id AND component_type = 'panel');
    
    INSERT INTO public.warranties (project_id, component_type, product_warranty_years, start_date)
    SELECT NEW.project_id, 'inverter', 5, CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM warranties WHERE project_id = NEW.project_id AND component_type = 'inverter');
    
    INSERT INTO public.warranties (project_id, component_type, product_warranty_years, start_date)
    SELECT NEW.project_id, 'workmanship', 5, CURRENT_DATE
    WHERE NOT EXISTS (SELECT 1 FROM warranties WHERE project_id = NEW.project_id AND component_type = 'workmanship');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for warranty creation
DROP TRIGGER IF EXISTS create_warranties_trigger ON public.project_stages;
CREATE TRIGGER create_warranties_trigger
AFTER UPDATE ON public.project_stages
FOR EACH ROW
EXECUTE FUNCTION public.create_project_warranties();

-- Create function to send notification on stage change
CREATE OR REPLACE FUNCTION public.notify_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_user_id UUID;
  project_name_val TEXT;
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    -- Get customer ID and project name
    SELECT l.customer_id, p.project_name INTO customer_user_id, project_name_val
    FROM projects p
    JOIN leads l ON l.id = p.lead_id
    WHERE p.id = NEW.project_id;
    
    IF customer_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, project_id, title, message, type)
      VALUES (
        customer_user_id,
        NEW.project_id,
        'Project Update: ' || NEW.stage_name,
        'Your project "' || project_name_val || '" has reached the stage: ' || NEW.stage_name,
        'stage_change'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stage change notifications
DROP TRIGGER IF EXISTS notify_stage_change_trigger ON public.project_stages;
CREATE TRIGGER notify_stage_change_trigger
AFTER UPDATE ON public.project_stages
FOR EACH ROW
EXECUTE FUNCTION public.notify_stage_change();

-- Create function to notify on payment
CREATE OR REPLACE FUNCTION public.notify_payment()
RETURNS TRIGGER AS $$
DECLARE
  customer_user_id UUID;
  project_name_val TEXT;
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    SELECT l.customer_id, p.project_name INTO customer_user_id, project_name_val
    FROM projects p
    JOIN leads l ON l.id = p.lead_id
    WHERE p.id = NEW.project_id;
    
    IF customer_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, project_id, title, message, type)
      VALUES (
        customer_user_id,
        NEW.project_id,
        'Payment Received: ₹' || NEW.amount::TEXT,
        'Payment of ₹' || NEW.amount::TEXT || ' has been recorded for your project "' || project_name_val || '".',
        'payment'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS notify_payment_trigger ON public.payments;
CREATE TRIGGER notify_payment_trigger
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment();

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers to new tables
CREATE TRIGGER update_project_stages_updated_at
BEFORE UPDATE ON public.project_stages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranties_updated_at
BEFORE UPDATE ON public.warranties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();