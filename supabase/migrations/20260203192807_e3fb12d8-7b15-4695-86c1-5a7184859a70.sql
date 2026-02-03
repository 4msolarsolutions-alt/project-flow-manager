-- =============================================
-- SOLAR EPC CRM - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. ENUMS
-- =============================================

-- Login types
CREATE TYPE public.login_type AS ENUM ('admin', 'employee', 'customer');

-- Internal employee roles
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'accounts', 
  'hr',
  'project_manager',
  'senior_engineer',
  'site_supervisor',
  'solar_engineer',
  'junior_technician',
  'storekeeper'
);

-- Project types
CREATE TYPE public.project_type AS ENUM ('epc', 'service', 'oam');

-- Lead status
CREATE TYPE public.lead_status AS ENUM (
  'new_call',
  'site_visit_required',
  'site_visit_assigned',
  'site_visit_completed',
  'quotation_prepared',
  'quote_sent',
  'customer_approved',
  'payment_received',
  'material_ordered',
  'material_delivered',
  'installation_started',
  'completed',
  'cancelled'
);

-- Building types
CREATE TYPE public.building_type AS ENUM ('rcc_roof', 'sheet_roof');

-- Panel loading methods
CREATE TYPE public.panel_loading AS ENUM ('lift_available', 'staircase_carry', 'rope_handling');

-- Structure materials
CREATE TYPE public.structure_material AS ENUM ('ms', 'aluminium', 'gi');

-- Task status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed');

-- Quote status
CREATE TYPE public.quote_status AS ENUM ('draft', 'sent', 'approved', 'rejected');

-- Payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'completed');

-- Payment type
CREATE TYPE public.payment_type AS ENUM ('advance', 'progress', 'final');

-- Expense type
CREATE TYPE public.expense_type AS ENUM ('food', 'travel', 'material', 'other');

-- Document type
CREATE TYPE public.document_type AS ENUM (
  'site_visit',
  'bom1',
  'quotation',
  'work_order',
  'bom2',
  'panel_details',
  'inverter_details',
  'battery_details',
  'material_list',
  'eb_document',
  'completion_report',
  'gst_invoice',
  'ceg_approval',
  'other'
);

-- 2. PROFILES TABLE
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login_type login_type NOT NULL DEFAULT 'employee',
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  company_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES TABLE (CRITICAL FOR RBAC)
-- =============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. LEADS TABLE
-- =============================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  pincode TEXT,
  lead_source TEXT,
  project_type project_type NOT NULL DEFAULT 'epc',
  status lead_status NOT NULL DEFAULT 'new_call',
  created_by UUID REFERENCES auth.users(id),
  assigned_pm UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. SITE VISITS TABLE
-- =============================================

CREATE TABLE public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  engineer_id UUID REFERENCES auth.users(id),
  
  -- Basic Details
  latitude TEXT,
  longitude TEXT,
  eb_service_no TEXT,
  
  -- Building Details
  building_type building_type,
  floors INTEGER,
  panel_loading panel_loading,
  
  -- Roof Details
  roof_length DECIMAL(10,2),
  roof_width DECIMAL(10,2),
  roof_area DECIMAL(10,2),
  
  -- Electrical Layout
  inverter_location TEXT,
  dc_length DECIMAL(10,2),
  ac_length DECIMAL(10,2),
  earth_length DECIMAL(10,2),
  earth_location TEXT,
  la_point BOOLEAN DEFAULT false,
  la_location TEXT,
  breaker_location TEXT,
  
  -- Structure Details
  structure_material structure_material,
  structure_height DECIMAL(10,2),
  
  -- Feedback
  customer_feedback TEXT,
  supervisor_name TEXT,
  supervisor_signature TEXT,
  
  -- Status
  status TEXT DEFAULT 'scheduled',
  scheduled_date DATE,
  scheduled_time TIME,
  completed_at TIMESTAMPTZ,
  
  -- Recommended capacity
  recommended_capacity DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- 6. PROJECTS TABLE
-- =============================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id),
  project_name TEXT NOT NULL,
  project_type project_type NOT NULL DEFAULT 'epc',
  capacity_kw DECIMAL(10,2),
  status TEXT DEFAULT 'planning',
  pm_id UUID REFERENCES auth.users(id),
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  total_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 7. QUOTATIONS TABLE
-- =============================================

CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  quotation_number TEXT,
  system_kw DECIMAL(10,2),
  bom JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(12,2),
  gst_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  validity_days INTEGER DEFAULT 15,
  terms_conditions TEXT,
  status quote_status DEFAULT 'draft',
  prepared_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- 8. TASKS TABLE
-- =============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_role app_role,
  status task_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 9. DAILY REPORTS TABLE
-- =============================================

CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  engineer_id UUID NOT NULL REFERENCES auth.users(id),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_done TEXT,
  delay_reason TEXT,
  completion_percent INTEGER DEFAULT 0,
  issues TEXT,
  next_day_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- 10. EXPENSES TABLE
-- =============================================

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  expense_type expense_type NOT NULL,
  description TEXT,
  persons INTEGER DEFAULT 1,
  days INTEGER DEFAULT 1,
  rate_per_day DECIMAL(10,2) DEFAULT 200,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  submitted_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 11. PAYMENTS TABLE
-- =============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_type payment_type NOT NULL,
  payment_method TEXT,
  transaction_ref TEXT,
  status payment_status DEFAULT 'pending',
  received_date DATE,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 12. DOCUMENTS TABLE
-- =============================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 13. MATERIALS TABLE
-- =============================================

CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  unit_price DECIMAL(12,2),
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 14. PROJECT MATERIALS (BILL OF MATERIALS)
-- =============================================

CREATE TABLE public.project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  material_name TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2),
  vendor_quotes JSONB DEFAULT '[]'::jsonb,
  selected_vendor TEXT,
  status TEXT DEFAULT 'pending',
  ordered_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;

-- 15. AMC REMINDERS TABLE
-- =============================================

CREATE TABLE public.amc_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  reminder_type TEXT DEFAULT 'amc',
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.amc_reminders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Check if user is any employee
CREATE OR REPLACE FUNCTION public.is_employee(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND login_type = 'employee'
  )
$$;

-- Check if user is customer
CREATE OR REPLACE FUNCTION public.is_customer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND login_type = 'customer'
  )
$$;

-- Check if user is project manager
CREATE OR REPLACE FUNCTION public.is_project_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'project_manager'
  )
$$;

-- Check if user is storekeeper
CREATE OR REPLACE FUNCTION public.is_storekeeper(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'storekeeper'
  )
$$;

-- Check if user is accounts
CREATE OR REPLACE FUNCTION public.is_accounts(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'accounts'
  )
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_visits_updated_at BEFORE UPDATE ON public.site_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- USER ROLES POLICIES
CREATE POLICY "Admin can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admin can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- LEADS POLICIES
CREATE POLICY "View leads" ON public.leads
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    created_by = auth.uid() OR
    assigned_pm = auth.uid() OR
    customer_id = auth.uid()
  );

CREATE POLICY "Create leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_employee(auth.uid())
  );

CREATE POLICY "Update leads" ON public.leads
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR
    created_by = auth.uid() OR
    assigned_pm = auth.uid()
  );

CREATE POLICY "Delete leads" ON public.leads
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- SITE VISITS POLICIES
CREATE POLICY "View site visits" ON public.site_visits
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    engineer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = site_visits.lead_id 
      AND (leads.assigned_pm = auth.uid() OR leads.created_by = auth.uid())
    )
  );

CREATE POLICY "Create site visits" ON public.site_visits
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_employee(auth.uid())
  );

CREATE POLICY "Update site visits" ON public.site_visits
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR
    engineer_id = auth.uid() OR
    public.is_project_manager(auth.uid())
  );

CREATE POLICY "Delete site visits" ON public.site_visits
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PROJECTS POLICIES
CREATE POLICY "View projects" ON public.projects
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    pm_id = auth.uid() OR
    public.is_employee(auth.uid())
  );

CREATE POLICY "Create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_project_manager(auth.uid())
  );

CREATE POLICY "Update projects" ON public.projects
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR pm_id = auth.uid()
  );

CREATE POLICY "Delete projects" ON public.projects
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- QUOTATIONS POLICIES
CREATE POLICY "View quotations" ON public.quotations
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    prepared_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = quotations.lead_id
      AND (leads.assigned_pm = auth.uid() OR leads.customer_id = auth.uid())
    )
  );

CREATE POLICY "Create quotations" ON public.quotations
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_employee(auth.uid())
  );

CREATE POLICY "Update quotations" ON public.quotations
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR prepared_by = auth.uid()
  );

CREATE POLICY "Delete quotations" ON public.quotations
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- TASKS POLICIES
CREATE POLICY "View tasks" ON public.tasks
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    public.is_project_manager(auth.uid())
  );

CREATE POLICY "Create tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_project_manager(auth.uid())
  );

CREATE POLICY "Update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR
    assigned_to = auth.uid() OR
    assigned_by = auth.uid()
  );

CREATE POLICY "Delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- DAILY REPORTS POLICIES
CREATE POLICY "View daily reports" ON public.daily_reports
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    engineer_id = auth.uid() OR
    public.is_project_manager(auth.uid())
  );

CREATE POLICY "Create daily reports" ON public.daily_reports
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR engineer_id = auth.uid()
  );

CREATE POLICY "Update daily reports" ON public.daily_reports
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR engineer_id = auth.uid()
  );

CREATE POLICY "Delete daily reports" ON public.daily_reports
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- EXPENSES POLICIES
CREATE POLICY "View expenses" ON public.expenses
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.is_accounts(auth.uid()) OR
    submitted_by = auth.uid()
  );

CREATE POLICY "Create expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_employee(auth.uid())
  );

CREATE POLICY "Update expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.is_accounts(auth.uid()) OR
    submitted_by = auth.uid()
  );

CREATE POLICY "Delete expenses" ON public.expenses
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PAYMENTS POLICIES
CREATE POLICY "View payments" ON public.payments
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.is_accounts(auth.uid()) OR
    recorded_by = auth.uid()
  );

CREATE POLICY "Create payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_accounts(auth.uid())
  );

CREATE POLICY "Update payments" ON public.payments
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR public.is_accounts(auth.uid())
  );

CREATE POLICY "Delete payments" ON public.payments
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- DOCUMENTS POLICIES
CREATE POLICY "View documents" ON public.documents
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    uploaded_by = auth.uid() OR
    public.is_employee(auth.uid())
  );

CREATE POLICY "Create documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_employee(auth.uid())
  );

CREATE POLICY "Update documents" ON public.documents
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR uploaded_by = auth.uid()
  );

CREATE POLICY "Delete documents" ON public.documents
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- MATERIALS POLICIES
CREATE POLICY "View materials" ON public.materials
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.is_storekeeper(auth.uid()) OR
    public.is_employee(auth.uid())
  );

CREATE POLICY "Create materials" ON public.materials
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_storekeeper(auth.uid())
  );

CREATE POLICY "Update materials" ON public.materials
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR public.is_storekeeper(auth.uid())
  );

CREATE POLICY "Delete materials" ON public.materials
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- PROJECT MATERIALS POLICIES
CREATE POLICY "View project materials" ON public.project_materials
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR
    public.is_storekeeper(auth.uid()) OR
    public.is_project_manager(auth.uid())
  );

CREATE POLICY "Create project materials" ON public.project_materials
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR
    public.is_storekeeper(auth.uid()) OR
    public.is_project_manager(auth.uid())
  );

CREATE POLICY "Update project materials" ON public.project_materials
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR public.is_storekeeper(auth.uid())
  );

CREATE POLICY "Delete project materials" ON public.project_materials
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- AMC REMINDERS POLICIES
CREATE POLICY "View amc reminders" ON public.amc_reminders
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid()) OR public.is_project_manager(auth.uid())
  );

CREATE POLICY "Create amc reminders" ON public.amc_reminders
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin(auth.uid()) OR public.is_project_manager(auth.uid())
  );

CREATE POLICY "Update amc reminders" ON public.amc_reminders
  FOR UPDATE TO authenticated USING (
    public.is_admin(auth.uid()) OR public.is_project_manager(auth.uid())
  );

CREATE POLICY "Delete amc reminders" ON public.amc_reminders
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- =============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, login_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'login_type')::login_type, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();