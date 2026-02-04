import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useSiteVisits } from "@/hooks/useSiteVisits";
import { useProjects } from "@/hooks/useProjects";
import { 
  ClipboardList, 
  Calendar, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Link } from "react-router-dom";

const EmployeeDashboard = () => {
  const { user, profile } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { siteVisits, isLoading: visitsLoading } = useSiteVisits();
  const { projects, isLoading: projectsLoading } = useProjects();

  // Filter data for current user
  const myTasks = tasks?.filter(task => task.assigned_to === user?.id) || [];
  const mySiteVisits = siteVisits?.filter(visit => visit.engineer_id === user?.id) || [];
  const myProjects = projects?.filter(project => project.pm_id === user?.id) || [];

  // Task stats
  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const overdueTasks = myTasks.filter(t => 
    t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed'
  );

  // Upcoming site visits (scheduled, not completed)
  const upcomingSiteVisits = mySiteVisits
    .filter(v => v.status === 'scheduled' && v.scheduled_date)
    .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime())
    .slice(0, 5);

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success';
      case 'in_progress': return 'bg-info/10 text-info';
      case 'delayed': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d');
  };

  return (
    <Layout title={`Welcome, ${profile?.first_name || 'Employee'}`}>
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
              <ClipboardList className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{inProgressTasks.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedTasks.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{overdueTasks.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              My Tasks
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : myTasks.length === 0 ? (
              <p className="text-muted-foreground">No tasks assigned to you</p>
            ) : (
              <div className="space-y-3">
                {myTasks
                  .filter(t => t.status !== 'completed')
                  .slice(0, 5)
                  .map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.projects?.project_name && (
                            <span className="text-xs text-muted-foreground truncate">
                              {task.projects.project_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {task.due_date && (
                          <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status !== 'completed' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {formatDueDate(task.due_date)}
                          </span>
                        )}
                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)} variant="secondary">
                          {task.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Site Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Site Visits
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/site-visits">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {visitsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : upcomingSiteVisits.length === 0 ? (
              <p className="text-muted-foreground">No upcoming site visits</p>
            ) : (
              <div className="space-y-3">
                {upcomingSiteVisits.map(visit => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {visit.leads?.customer_name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {visit.leads?.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isToday(new Date(visit.scheduled_date!)) ? 'text-primary' : ''}`}>
                          {formatDueDate(visit.scheduled_date!)}
                        </p>
                        {visit.scheduled_time && (
                          <p className="text-xs text-muted-foreground">
                            {visit.scheduled_time}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Projects */}
      {myProjects.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              My Projects
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myProjects.slice(0, 6).map(project => (
                  <div
                    key={project.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium truncate">{project.project_name}</p>
                      <Badge variant="outline" className="capitalize">
                        {project.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.capacity_kw && (
                        <p>{project.capacity_kw} kW</p>
                      )}
                      {project.start_date && (
                        <p>Started: {format(new Date(project.start_date), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default EmployeeDashboard;
