import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

const tasksData = {
  todo: [
    {
      id: 1,
      title: "Submit quotation for Tech Park",
      project: "Tech Park Phase 2",
      assignee: "Priya Sharma",
      priority: "high",
      dueDate: "Feb 5, 2025",
    },
    {
      id: 2,
      title: "Order panels for Industrial Complex",
      project: "Industrial Complex B",
      assignee: "Rohit Mehta",
      priority: "medium",
      dueDate: "Feb 8, 2025",
    },
    {
      id: 3,
      title: "Schedule site visit for new lead",
      project: "Leads",
      assignee: "Vikram Singh",
      priority: "low",
      dueDate: "Feb 10, 2025",
    },
  ],
  inProgress: [
    {
      id: 4,
      title: "Site inspection at Green Valley",
      project: "Green Valley Apartments",
      assignee: "Rahul Kumar",
      priority: "high",
      dueDate: "Today",
    },
    {
      id: 5,
      title: "Panel installation - Day 3",
      project: "Sharma Residence",
      assignee: "Vikram Singh",
      priority: "high",
      dueDate: "Today",
    },
    {
      id: 6,
      title: "Electrical wiring completion",
      project: "Green Valley Apartments",
      assignee: "Ananya Gupta",
      priority: "medium",
      dueDate: "Feb 6, 2025",
    },
  ],
  completed: [
    {
      id: 7,
      title: "Foundation work completed",
      project: "Industrial Complex B",
      assignee: "Priya Sharma",
      priority: "high",
      completedDate: "Jan 30, 2025",
    },
    {
      id: 8,
      title: "Client approval received",
      project: "Tech Park Phase 2",
      assignee: "Ananya Gupta",
      priority: "medium",
      completedDate: "Jan 28, 2025",
    },
  ],
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case "medium":
      return <Clock className="h-4 w-4 text-warning" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
};

const TaskCard = ({ task, completed = false }: { task: any; completed?: boolean }) => (
  <div className="rounded-lg bg-card border border-border p-4 transition-all hover:shadow-sm">
    <div className="flex items-start gap-3">
      <Checkbox className="mt-1" checked={completed} />
      <div className="flex-1">
        <p className={`font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{task.project}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {task.assignee.charAt(0)}
            </div>
            <span className="text-xs text-muted-foreground">{task.assignee}</span>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityIcon(task.priority)}
            <span className="text-xs text-muted-foreground">
              {completed ? task.completedDate : task.dueDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Tasks = () => {
  return (
    <Layout title="Tasks">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Select defaultValue="all">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="green-valley">Green Valley Apartments</SelectItem>
            <SelectItem value="tech-park">Tech Park Phase 2</SelectItem>
            <SelectItem value="sharma">Sharma Residence</SelectItem>
            <SelectItem value="industrial">Industrial Complex B</SelectItem>
          </SelectContent>
        </Select>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* To Do Column */}
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">To Do</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {tasksData.todo.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksData.todo.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">In Progress</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-medium text-warning">
              {tasksData.inProgress.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksData.inProgress.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Completed</h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-xs font-medium text-success">
              {tasksData.completed.length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksData.completed.map((task) => (
              <TaskCard key={task.id} task={task} completed />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Tasks;
