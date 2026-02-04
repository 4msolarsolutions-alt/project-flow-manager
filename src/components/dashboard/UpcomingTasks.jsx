import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
  {
    id: 1,
    title: "Site inspection at Green Valley",
    project: "Green Valley Apartments",
    dueDate: "Today, 2:00 PM",
    priority: "high",
    assignee: "Rahul Kumar",
  },
  {
    id: 2,
    title: "Submit quotation for Tech Park",
    project: "Tech Park Phase 2",
    dueDate: "Tomorrow, 10:00 AM",
    priority: "medium",
    assignee: "Priya Sharma",
  },
  {
    id: 3,
    title: "Panel installation - Day 3",
    project: "Sharma Residence",
    dueDate: "Today, 9:00 AM",
    priority: "high",
    assignee: "Vikram Singh",
  },
  {
    id: 4,
    title: "Client meeting for project kickoff",
    project: "Industrial Complex B",
    dueDate: "Feb 5, 11:00 AM",
    priority: "low",
    assignee: "Ananya Gupta",
  },
];

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "medium":
      return <Clock className="h-4 w-4 text-warning" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
};

export function UpcomingTasks() {
  return (
    <div className="rounded-xl bg-card border border-border animate-fade-in">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-4 px-6 py-4">
            <div className="mt-0.5">{getPriorityIcon(task.priority)}</div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{task.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{task.project}</p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{task.dueDate}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{task.assignee}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
