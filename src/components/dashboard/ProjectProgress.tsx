import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export function ProjectProgress() {
  const { projects, isLoading } = useProjects();
  const navigate = useNavigate();
  
  // Filter active projects (not completed or cancelled)
  const activeProjects = projects?.filter(p => 
    p.status && !['completed', 'cancelled'].includes(p.status)
  ).slice(0, 4) || [];

  // Calculate progress based on status
  const getProgress = (status: string | null) => {
    const statusProgress: Record<string, number> = {
      'planning': 10,
      'site_survey': 20,
      'quotation': 30,
      'payment_pending': 40,
      'material_ordered': 50,
      'material_delivered': 60,
      'installation': 75,
      'testing': 90,
      'completed': 100,
      'delayed': 50,
    };
    return statusProgress[status || 'planning'] || 10;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border animate-fade-in">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">Active Projects</h3>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">Active Projects</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            Add Project
          </Button>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          No active projects yet. Convert a lead to start a project.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border animate-fade-in">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Active Projects</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          View All
        </Button>
      </div>
      <div className="divide-y divide-border">
        {activeProjects.map((project) => {
          const progress = getProgress(project.status);
          return (
            <div key={project.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{project.project_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.capacity_kw ? `${project.capacity_kw} KW` : 'Capacity TBD'} • {project.status?.replace('_', ' ').toUpperCase() || 'Planning'}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {project.expected_end_date ? format(new Date(project.expected_end_date), 'MMM dd, yyyy') : 'No deadline'}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground">{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
