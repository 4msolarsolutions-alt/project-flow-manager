-- Add status column to time_logs table
ALTER TABLE public.time_logs 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'completed'));

-- Update existing records: mark records with time_out as completed
UPDATE public.time_logs 
SET status = 'completed' 
WHERE time_out IS NOT NULL AND (status IS NULL OR status = 'active');

-- For records without time_out, keep only the most recent active per user
-- Mark all except the latest as completed with time_out = time_in
WITH ranked_active AS (
  SELECT id, user_id, time_in,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY time_in DESC) as rn
  FROM public.time_logs
  WHERE time_out IS NULL
)
UPDATE public.time_logs tl
SET 
  status = 'completed',
  time_out = tl.time_in  -- Set time_out = time_in (total_hours will auto-calculate to 0)
FROM ranked_active ra
WHERE tl.id = ra.id AND ra.rn > 1;

-- Ensure the remaining active records have status = 'active'
UPDATE public.time_logs 
SET status = 'active' 
WHERE time_out IS NULL AND status IS NULL;

-- Create index for faster active session lookups
CREATE INDEX IF NOT EXISTS idx_time_logs_user_active 
ON public.time_logs (user_id) 
WHERE status = 'active';

-- Create a function to prevent multiple active sessions
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check on INSERT
  IF TG_OP = 'INSERT' THEN
    -- Check if user already has an active session
    IF EXISTS (
      SELECT 1 FROM public.time_logs
      WHERE user_id = NEW.user_id
      AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'You are already clocked in. Please clock out first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single active session
DROP TRIGGER IF EXISTS enforce_single_active_session ON public.time_logs;
CREATE TRIGGER enforce_single_active_session
  BEFORE INSERT ON public.time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_multiple_active_sessions();

-- Create function to auto-set status to completed on clock out
CREATE OR REPLACE FUNCTION public.auto_complete_time_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When time_out is set, mark as completed
  IF NEW.time_out IS NOT NULL AND OLD.time_out IS NULL THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-complete on clock out
DROP TRIGGER IF EXISTS auto_complete_on_clockout ON public.time_logs;
CREATE TRIGGER auto_complete_on_clockout
  BEFORE UPDATE ON public.time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_time_log();