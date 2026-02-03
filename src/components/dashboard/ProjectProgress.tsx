import { Progress } from "@/components/ui/progress";

const projects = [
  {
    id: 1,
    name: "Green Valley Apartments",
    capacity: "50 KW",
    progress: 75,
    pm: "Vikram Singh",
    dueDate: "Feb 15, 2025",
  },
  {
    id: 2,
    name: "Tech Park Phase 2",
    capacity: "200 KW",
    progress: 45,
    pm: "Ananya Gupta",
    dueDate: "Mar 30, 2025",
  },
  {
    id: 3,
    name: "Sharma Residence",
    capacity: "8 KW",
    progress: 90,
    pm: "Rohit Mehta",
    dueDate: "Feb 10, 2025",
  },
  {
    id: 4,
    name: "Industrial Complex B",
    capacity: "500 KW",
    progress: 20,
    pm: "Priya Sharma",
    dueDate: "Jun 15, 2025",
  },
];

export function ProjectProgress() {
  return (
    <div className="rounded-xl bg-card border border-border animate-fade-in">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Active Projects</h3>
      </div>
      <div className="divide-y divide-border">
        {projects.map((project) => (
          <div key={project.id} className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{project.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.capacity} • PM: {project.pm}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{project.dueDate}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={project.progress} className="h-2 flex-1" />
              <span className="text-sm font-medium text-foreground">{project.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
