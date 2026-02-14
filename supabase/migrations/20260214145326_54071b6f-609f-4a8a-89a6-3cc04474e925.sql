
-- 1. Add 'i_and_c' to project_type enum
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'i_and_c';

-- 2. Add project_category enum
DO $$ BEGIN
  CREATE TYPE public.project_category AS ENUM ('residential', 'commercial', 'industrial');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add financial columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_category public.project_category DEFAULT 'residential',
  ADD COLUMN IF NOT EXISTS project_revenue numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_labor_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_food_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_travel_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_material_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_other_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hours_worked numeric DEFAULT 0;

-- 4. Add salary/allowance fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS monthly_salary numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_wage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS food_allowance_per_day numeric DEFAULT 200,
  ADD COLUMN IF NOT EXISTS travel_rate_per_km numeric DEFAULT 10;

-- 5. Add distance_km to time_logs
ALTER TABLE public.time_logs
  ADD COLUMN IF NOT EXISTS distance_km numeric DEFAULT 0;
