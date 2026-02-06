import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { useSiteVisits } from "@/hooks/useSiteVisits";
import { useProjects } from "@/hooks/useProjects";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { 
  ClipboardList, 
  Calendar, 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Play,
  Square,
  DollarSign
} from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const EmployeeDashboard = () => {
  const { user, profile } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { siteVisits, isLoading: visitsLoading } = useSiteVisits();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { activeSession, clockIn, clockOut, isLoading: timeLoading, timeLogs } = useTimeLogs();
  
  // Get today's completed log for hours display
  const today = new Date().toISOString().split('T')[0];
  const todayLog = timeLogs?.find(log => log.date === today && log.user_id === user?.id);

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

  const isClockedIn = activeSession && activeSession.time_in && !activeSession.time_out;

  const handleStartWork = async () => {
    try {
      // Get location if available
      let location = { latitude: null, longitude: null };
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: pos.coords.latitude.toString() as any,
            longitude: pos.coords.longitude.toString() as any,
          };
        } catch {
          // Location not available
        }
      }
      await clockIn.mutateAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success("Work started! You're now clocked in.");
    } catch (error) {
      toast.error("Failed to start work");
    }
  };

  const handleEndWork = async () => {
    if (!activeSession) return;
    try {
      let location = { latitude: null, longitude: null };
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          location = {
            latitude: pos.coords.latitude.toString() as any,
            longitude: pos.coords.longitude.toString() as any,
          };
        } catch {
          // Location not available
        }
      }
      await clockOut.mutateAsync({
        id: activeSession.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success("Work ended! You're now clocked out.");
    } catch (error) {
      toast.error("Failed to end work");
    }
  };

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
    <AppLayout title="My Dashboard">
      {/* Summary Stats - Row 1 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4 md:p-6">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-info/10 shrink-0">
              <FolderKanban className="h-5 w-5 md:h-6 md:w-6 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">My Projects</p>
              <p className="text-xl md:text-2xl font-bold">{myProjects.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4 md:p-6">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-warning/10 shrink-0">
              <ClipboardList className="h-5 w-5 md:h-6 md:w-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Pending Tasks</p>
              <p className="text-xl md:text-2xl font-bold">{pendingTasks.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4 md:p-6">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-success/10 shrink-0">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Today Hours</p>
              <p className="text-xl md:text-2xl font-bold">{todayLog?.total_hours?.toFixed(1) || "0"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4 md:p-6">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">This Month</p>
              <p className="text-xl md:text-2xl font-bold">-</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Area - Start/End Work - Row 2 */}
      <Card className="mt-4 md:mt-6 border-2 border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-lg">
              {isClockedIn ? "Currently Working" : "Ready to Start?"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isClockedIn 
                ? `Started at ${activeSession?.time_in ? format(new Date(activeSession.time_in), 'h:mm a') : ''}`
                : "Clock in to start tracking your time"
              }
            </p>
          </div>
          {isClockedIn ? (
            <Button 
              size="lg" 
              variant="destructive" 
              className="gap-2 w-full sm:w-auto"
              onClick={handleEndWork}
              disabled={clockOut.isPending}
            >
              <Square className="h-5 w-5" />
              End Work
            </Button>
          ) : (
            <Button 
              size="lg" 
              className="gap-2 bg-success hover:bg-success/90 w-full sm:w-auto"
              onClick={handleStartWork}
              disabled={clockIn.isPending || (todayLog && !!todayLog.time_out)}
            >
              <Play className="h-5 w-5" />
              Start Work
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid - Row 3 */}
      <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <ClipboardList className="h-5 w-5" />
              My Tasks (Today)
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/tasks">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : myTasks.filter(t => t.status !== 'completed').length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {myTasks
                  .filter(t => t.status !== 'completed')
                  .slice(0, 5)
                  .map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-2 md:p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{task.title}</p>
                        {task.projects?.project_name && (
                          <span className="text-xs text-muted-foreground">
                            {task.projects.project_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
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

        {/* My Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FolderKanban className="h-5 w-5" />
              My Projects
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/projects">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : myProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects assigned</p>
            ) : (
              <div className="space-y-2">
                {myProjects.slice(0, 5).map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-2 md:p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{project.project_name}</p>
                      {project.capacity_kw && (
                        <span className="text-xs text-muted-foreground">{project.capacity_kw} kW</span>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {project.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EmployeeDashboard;
