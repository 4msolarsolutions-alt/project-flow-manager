-- Create time_logs table for GPS attendance tracking
CREATE TABLE public.time_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in TIMESTAMP WITH TIME ZONE,
  time_out TIMESTAMP WITH TIME ZONE,
  latitude_in TEXT,
  longitude_in TEXT,
  latitude_out TEXT,
  longitude_out TEXT,
  total_hours NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN time_in IS NOT NULL AND time_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (time_out - time_in)) / 3600
      ELSE NULL
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees can view their own logs, admins can view all
CREATE POLICY "View time logs"
ON public.time_logs
FOR SELECT
USING (
  is_admin(auth.uid()) 
  OR user_id = auth.uid()
  OR is_project_manager(auth.uid())
);

-- Employees can create their own logs
CREATE POLICY "Create time logs"
ON public.time_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Employees can update their own logs (for clock out)
CREATE POLICY "Update own time logs"
ON public.time_logs
FOR UPDATE
USING (user_id = auth.uid());

-- Only admins can delete
CREATE POLICY "Delete time logs"
ON public.time_logs
FOR DELETE
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_time_logs_updated_at
BEFORE UPDATE ON public.time_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_time_logs_user_date ON public.time_logs(user_id, date);
CREATE INDEX idx_time_logs_project ON public.time_logs(project_id);