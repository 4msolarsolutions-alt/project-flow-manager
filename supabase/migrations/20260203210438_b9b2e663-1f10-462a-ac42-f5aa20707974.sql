-- Add foreign key from tasks.assigned_to to profiles.id
ALTER TABLE public.tasks
ADD CONSTRAINT fk_tasks_assigned_to_profiles
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;