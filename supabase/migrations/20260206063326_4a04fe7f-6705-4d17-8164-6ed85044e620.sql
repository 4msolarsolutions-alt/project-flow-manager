-- Add work_type enum
DO $$ BEGIN
  CREATE TYPE work_type AS ENUM ('lead', 'project');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add work_type and lead_id to expenses table
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS work_type text DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

-- Add work_type and lead_id to time_logs table
ALTER TABLE time_logs 
  ADD COLUMN IF NOT EXISTS work_type text DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

-- Add work_type and lead_id to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS work_type text DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_work_type ON expenses(work_type);
CREATE INDEX IF NOT EXISTS idx_expenses_lead_id ON expenses(lead_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_work_type ON time_logs(work_type);
CREATE INDEX IF NOT EXISTS idx_time_logs_lead_id ON time_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_work_type ON tasks(work_type);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);