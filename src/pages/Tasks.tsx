import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, AlertCircle, Clock, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { SiteVisitForm } from "@/components/site-visits/SiteVisitForm";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database['public']['Enums']['task_status'];

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

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Check if a task is a site visit task
const isSiteVisitTask = (task: any) => {
  const title = task.title?.toLowerCase() || '';
  return title.includes('site visit') || title.includes('site-visit') || title.includes('sitevisit');
};

interface TaskCardProps {
  task: any;
  completed?: boolean;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskClick?: (task: any) => void;
}

const TaskCard = ({ task, completed = false, onStatusChange, onTaskClick }: TaskCardProps) => {
  const profile = task.profiles;
  const assigneeName = profile?.first_name || 'Unassigned';
  const isSiteVisit = isSiteVisitTask(task);
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on checkbox
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
    
    if (isSiteVisit && onTaskClick && !completed) {
      onTaskClick(task);
    }
  };
  
  return (
    <div 
      className={`rounded-lg bg-card border border-border p-4 transition-all hover:shadow-sm ${
        isSiteVisit && !completed ? 'cursor-pointer hover:border-primary/50' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          className="mt-1" 
          checked={completed}
          onCheckedChange={(checked) => {
            if (checked) {
              onStatusChange(task.id, 'completed');
            } else {
              onStatusChange(task.id, 'pending');
            }
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </p>
            {isSiteVisit && !completed && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" />
                Tap to fill
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {task.work_type === 'lead' 
              ? task.leads?.customer_name || 'Lead task'
              : task.projects?.project_name || 'No project'}
          </p>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {assigneeName.charAt(0)}
              </div>
              <span className="text-xs text-muted-foreground">{assigneeName}</span>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityIcon(task.priority || 'medium')}
              <span className="text-xs text-muted-foreground">
                {completed ? formatDate(task.completed_at) : formatDate(task.due_date)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tasks = () => {
  const { tasks, isLoading, createTask, updateTaskStatus } = useTasks();
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { data: users } = useUsers();
  const { user } = useAuth();
  
  const [projectFilter, setProjectFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    work_type: "project",
    project_id: "",
    lead_id: "",
    assigned_to: "",
    assigned_role: "" as Database['public']['Enums']['app_role'] | "",
    priority: "medium",
    due_date: "",
  });

  // Site visit form state
  const [isSiteVisitFormOpen, setIsSiteVisitFormOpen] = useState(false);
  const [selectedSiteVisitTask, setSelectedSiteVisitTask] = useState<any>(null);

  const handleSiteVisitTaskClick = (task: any) => {
    console.log('Site visit task clicked:', task);
    // For lead-type tasks with a lead_id, open the site visit form
    if (task.work_type === 'lead' && task.lead_id) {
      setSelectedSiteVisitTask(task);
      setIsSiteVisitFormOpen(true);
    }
  };

  const handleSiteVisitComplete = () => {
    if (selectedSiteVisitTask) {
      // Mark the task as completed after site visit form submission
      updateTaskStatus.mutate({ id: selectedSiteVisitTask.id, status: 'completed' });
    }
    setIsSiteVisitFormOpen(false);
    setSelectedSiteVisitTask(null);
  };

  const filteredTasks = tasks?.filter((task) => {
    if (projectFilter === "all") return true;
    return task.project_id === projectFilter;
  }) || [];

  const todoTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const delayedTasks = filteredTasks.filter(t => t.status === 'delayed');

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskStatus.mutate({ id: taskId, status });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        work_type: formData.work_type,
        project_id: formData.work_type === "project" && formData.project_id ? formData.project_id : null,
        lead_id: formData.work_type === "lead" && formData.lead_id ? formData.lead_id : null,
        assigned_to: formData.assigned_to || null,
        assigned_role: formData.assigned_role as Database['public']['Enums']['app_role'] || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_by: user?.id,
        status: 'pending',
      });
      
      setIsAddDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        work_type: "project",
        project_id: "",
        lead_id: "",
        assigned_to: "",
        assigned_role: "",
        priority: "medium",
        due_date: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Tasks">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* To Do Column */}
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">To Do</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {todoTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {todoTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending tasks</p>
              ) : (
                todoTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onStatusChange={handleStatusChange}
                    onTaskClick={handleSiteVisitTaskClick}
                  />
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">In Progress</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-medium text-warning">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks in progress</p>
              ) : (
                inProgressTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    onStatusChange={handleStatusChange}
                    onTaskClick={handleSiteVisitTaskClick}
                  />
                ))
              )}
            </div>
          </div>

          {/* Delayed Column */}
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Delayed</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/20 text-xs font-medium text-destructive">
                {delayedTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {delayedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No delayed tasks</p>
              ) : (
                delayedTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task}
                    onStatusChange={handleStatusChange}
                    onTaskClick={handleSiteVisitTaskClick}
                  />
                ))
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Completed</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-xs font-medium text-success">
                {completedTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No completed tasks</p>
              ) : (
                completedTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    completed
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work_type">Work Type *</Label>
                <Select
                  value={formData.work_type}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    work_type: value,
                    project_id: "",
                    lead_id: ""
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead Site Visit</SelectItem>
                    <SelectItem value="project">Project Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.work_type === "lead" && (
                <div className="space-y-2">
                  <Label htmlFor="lead">Lead</Label>
                  <Select
                    value={formData.lead_id}
                    onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.work_type === "project" && (
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To *</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Site Visit Form Modal */}
      {selectedSiteVisitTask && (
        <SiteVisitForm
          isOpen={isSiteVisitFormOpen}
          onClose={() => {
            setIsSiteVisitFormOpen(false);
            setSelectedSiteVisitTask(null);
          }}
          leadId={selectedSiteVisitTask.lead_id}
          leadName={selectedSiteVisitTask.leads?.customer_name || 'Unknown Lead'}
          leadAddress={selectedSiteVisitTask.leads?.address || 'No address'}
          onComplete={handleSiteVisitComplete}
        />
      )}
    </AppLayout>
  );
};

export default Tasks;