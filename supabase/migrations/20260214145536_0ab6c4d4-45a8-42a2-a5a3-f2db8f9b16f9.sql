
-- 1. Function to calculate labor cost based on salary type
CREATE OR REPLACE FUNCTION public.calculate_labor_cost(
  p_total_hours numeric,
  p_salary_type text,
  p_hourly_rate numeric,
  p_daily_wage numeric,
  p_monthly_salary numeric
) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF p_salary_type = 'hourly' THEN
    RETURN p_total_hours * COALESCE(p_hourly_rate, 0);
  ELSIF p_salary_type = 'daily' THEN
    RETURN (COALESCE(p_daily_wage, 0) / 8.0) * p_total_hours;
  ELSE -- monthly
    RETURN (COALESCE(p_monthly_salary, 0) / 26.0 / 8.0) * p_total_hours;
  END IF;
END;
$$;

-- 2. Function to rollup time log costs to project
CREATE OR REPLACE FUNCTION public.rollup_timelog_to_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hours numeric;
  v_labor_cost numeric;
  v_food_cost numeric;
  v_travel_cost numeric;
  v_emp profiles%ROWTYPE;
  v_project_id uuid;
  v_old_hours numeric DEFAULT 0;
  v_old_labor numeric DEFAULT 0;
  v_old_food numeric DEFAULT 0;
  v_old_travel numeric DEFAULT 0;
BEGIN
  -- Only process project work type with a project_id
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_project_id := NEW.project_id;
  ELSE
    v_project_id := OLD.project_id;
  END IF;

  IF v_project_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  -- Get employee profile
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO v_emp FROM profiles WHERE id = OLD.user_id;
  ELSE
    SELECT * INTO v_emp FROM profiles WHERE id = NEW.user_id;
  END IF;

  -- Calculate OLD values (for UPDATE/DELETE)
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.time_out IS NOT NULL AND OLD.work_type = 'project' THEN
    v_old_hours := COALESCE(OLD.total_hours, 0);
    v_old_labor := calculate_labor_cost(v_old_hours, COALESCE(v_emp.salary_type, 'monthly'), COALESCE(v_emp.hourly_rate, 0), COALESCE(v_emp.daily_wage, 0), COALESCE(v_emp.monthly_salary, 0));
    v_old_food := CASE WHEN v_old_hours > 0 THEN COALESCE(v_emp.food_allowance_per_day, 200) ELSE 0 END;
    v_old_travel := COALESCE(OLD.distance_km, 0) * COALESCE(v_emp.travel_rate_per_km, 10);
  END IF;

  -- Calculate NEW values (for INSERT/UPDATE)
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.time_out IS NOT NULL AND NEW.work_type = 'project' THEN
    v_hours := COALESCE(NEW.total_hours, 0);
    v_labor_cost := calculate_labor_cost(v_hours, COALESCE(v_emp.salary_type, 'monthly'), COALESCE(v_emp.hourly_rate, 0), COALESCE(v_emp.daily_wage, 0), COALESCE(v_emp.monthly_salary, 0));
    v_food_cost := CASE WHEN v_hours > 0 THEN COALESCE(v_emp.food_allowance_per_day, 200) ELSE 0 END;
    v_travel_cost := COALESCE(NEW.distance_km, 0) * COALESCE(v_emp.travel_rate_per_km, 10);
  ELSE
    v_hours := 0; v_labor_cost := 0; v_food_cost := 0; v_travel_cost := 0;
  END IF;

  -- Update project with delta
  UPDATE projects SET
    total_hours_worked = GREATEST(0, COALESCE(total_hours_worked, 0) + v_hours - v_old_hours),
    total_labor_cost = GREATEST(0, COALESCE(total_labor_cost, 0) + v_labor_cost - v_old_labor),
    total_food_cost = GREATEST(0, COALESCE(total_food_cost, 0) + v_food_cost - v_old_food),
    total_travel_cost = GREATEST(0, COALESCE(total_travel_cost, 0) + v_travel_cost - v_old_travel)
  WHERE id = v_project_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- 3. Create trigger on time_logs
DROP TRIGGER IF EXISTS trg_rollup_timelog ON public.time_logs;
CREATE TRIGGER trg_rollup_timelog
  AFTER INSERT OR UPDATE OR DELETE ON public.time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.rollup_timelog_to_project();

-- 4. Function to rollup approved expenses to project
CREATE OR REPLACE FUNCTION public.rollup_expense_to_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_project_id uuid;
  v_amount numeric;
  v_type text;
  v_col text;
BEGIN
  -- Only handle project-scope expenses with a project_id
  -- Trigger on status change to 'approved' or reversal from 'approved'
  
  -- CASE 1: Expense just got approved
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.project_id IS NOT NULL AND COALESCE(NEW.expense_scope, 'project') = 'project' THEN
    v_amount := COALESCE(NEW.verified_amount, NEW.amount);
    v_type := NEW.expense_type::text;
    
    IF v_type = 'material' THEN
      UPDATE projects SET total_material_cost = COALESCE(total_material_cost, 0) + v_amount WHERE id = NEW.project_id;
    ELSIF v_type = 'travel' THEN
      UPDATE projects SET total_travel_cost = COALESCE(total_travel_cost, 0) + v_amount WHERE id = NEW.project_id;
    ELSIF v_type = 'food' THEN
      UPDATE projects SET total_food_cost = COALESCE(total_food_cost, 0) + v_amount WHERE id = NEW.project_id;
    ELSE
      UPDATE projects SET total_other_cost = COALESCE(total_other_cost, 0) + v_amount WHERE id = NEW.project_id;
    END IF;
  END IF;

  -- CASE 2: Expense approval reversed
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' AND OLD.project_id IS NOT NULL AND COALESCE(OLD.expense_scope, 'project') = 'project' THEN
    v_amount := COALESCE(OLD.verified_amount, OLD.amount);
    v_type := OLD.expense_type::text;
    
    IF v_type = 'material' THEN
      UPDATE projects SET total_material_cost = GREATEST(0, COALESCE(total_material_cost, 0) - v_amount) WHERE id = OLD.project_id;
    ELSIF v_type = 'travel' THEN
      UPDATE projects SET total_travel_cost = GREATEST(0, COALESCE(total_travel_cost, 0) - v_amount) WHERE id = OLD.project_id;
    ELSIF v_type = 'food' THEN
      UPDATE projects SET total_food_cost = GREATEST(0, COALESCE(total_food_cost, 0) - v_amount) WHERE id = OLD.project_id;
    ELSE
      UPDATE projects SET total_other_cost = GREATEST(0, COALESCE(total_other_cost, 0) - v_amount) WHERE id = OLD.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Create trigger on expenses
DROP TRIGGER IF EXISTS trg_rollup_expense ON public.expenses;
CREATE TRIGGER trg_rollup_expense
  AFTER UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.rollup_expense_to_project();
