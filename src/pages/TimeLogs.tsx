import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTimeLogs, useGeolocation } from "@/hooks/useTimeLogs";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Clock, MapPin, Play, Square, Loader2, AlertCircle } from "lucide-react";

export default function TimeLogs() {
  const { timeLogs, isLoading, activeSession, clockIn, clockOut } = useTimeLogs();
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { getLocation } = useGeolocation();
  const { isAdmin } = useAuth();
  
  const [workType, setWorkType] = useState<string>("project");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleClockIn = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      const location = await getLocation();
      await clockIn.mutateAsync({
        work_type: workType,
        project_id: workType === "project" && selectedProject && selectedProject !== "none" ? selectedProject : undefined,
        lead_id: workType === "lead" && selectedLead && selectedLead !== "none" ? selectedLead : undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        notes: notes || undefined,
      });
      setNotes("");
      setSelectedProject("");
      setSelectedLead("");
      setWorkType("project");
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeSession) return;
    
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      const location = await getLocation();
      await clockOut.mutateAsync({
        id: activeSession.id,
        latitude: location.latitude,
        longitude: location.longitude,
        notes: notes || activeSession.notes || undefined,
      });
      setNotes("");
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return format(new Date(timeString), "hh:mm a");
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return "-";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatCoordinates = (lat: string | null, lng: string | null) => {
    if (!lat || !lng) return "-";
    return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
  };

  return (
    <AppLayout title="Time Logs">
      <div className="space-y-6">
        {/* Clock In/Out Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {activeSession ? "Currently Clocked In" : "Clock In"}
            </CardTitle>
            <CardDescription>
              {activeSession 
                ? `Started at ${formatTime(activeSession.time_in)} - GPS location will be recorded on clock out`
                : "Record your attendance with GPS location"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{locationError}</span>
              </div>
            )}

            {!activeSession && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Work Type *</label>
                    <Select value={workType} onValueChange={(value) => {
                      setWorkType(value);
                      setSelectedProject("");
                      setSelectedLead("");
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead Site Visit</SelectItem>
                        <SelectItem value="project">Project Work</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {workType === "lead" ? "Tracking only (not counted in payroll)" : "Hours counted in payroll"}
                    </p>
                  </div>

                  {workType === "lead" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Lead *</label>
                      <Select value={selectedLead} onValueChange={setSelectedLead}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific lead</SelectItem>
                          {leads?.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.customer_name} - {lead.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {workType === "project" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Project</label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific project</SelectItem>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                  <Textarea 
                    placeholder="Add any notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1}
                  />
                </div>
              </div>
            )}

            {activeSession && (
              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Check-in Location: {formatCoordinates(activeSession.latitude_in, activeSession.longitude_in)}</span>
                </div>
                {activeSession.notes && (
                  <p className="text-sm text-muted-foreground">Notes: {activeSession.notes}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {activeSession ? (
                <Button 
                  onClick={handleClockOut}
                  disabled={isGettingLocation || clockOut.isPending}
                  variant="destructive"
                  className="gap-2"
                >
                  {(isGettingLocation || clockOut.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Clock Out
                </Button>
              ) : (
                <Button 
                  onClick={handleClockIn}
                  disabled={isGettingLocation || clockIn.isPending}
                  className="gap-2"
                >
                  {(isGettingLocation || clockIn.isPending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Clock In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Logs History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              {isAdmin() ? "All employee time logs" : "Your attendance records"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : timeLogs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time logs recorded yet.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Work Type</TableHead>
                      <TableHead>Lead / Project</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Location In</TableHead>
                      <TableHead>Location Out</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.work_type === 'project' ? 'default' : 'secondary'}>
                            {log.work_type === 'project' ? 'Project' : 'Lead'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.work_type === 'lead' 
                            ? log.leads?.customer_name || '-'
                            : log.projects?.project_name || '-'}
                        </TableCell>
                        <TableCell>{formatTime(log.time_in)}</TableCell>
                        <TableCell>{formatTime(log.time_out)}</TableCell>
                        <TableCell className="font-medium">
                          {formatHours(log.total_hours)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatCoordinates(log.latitude_in, log.longitude_in)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatCoordinates(log.latitude_out, log.longitude_out)}
                        </TableCell>
                        <TableCell>
                          {log.time_out ? (
                            <Badge variant="default">Completed</Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
