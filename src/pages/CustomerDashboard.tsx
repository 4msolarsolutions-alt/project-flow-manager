import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerProjects, PROJECT_STATUS_FLOW, getStatusIndex } from "@/hooks/useCustomerProjects";
import { format } from "date-fns";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Zap, 
  IndianRupee,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Shield,
  Download
} from "lucide-react";

export default function CustomerDashboard() {
  const { profile } = useAuth();
  const { projects, isLoading } = useCustomerProjects();

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  if (isLoading) {
    return (
      <AppLayout title="My Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const primaryProject = projects?.[0];

  return (
    <AppLayout title="My Dashboard">
      {/* Welcome Banner */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                Welcome, {primaryProject?.leads?.customer_name || profile?.first_name}!
              </h2>
              <p className="text-primary-foreground/80 mt-1 text-sm md:text-base">
                Track your solar installation progress below
              </p>
            </div>
            {primaryProject && (
              <Badge variant="secondary" className="w-fit text-sm px-4 py-2">
                {primaryProject.capacity_kw} kW System
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Row 1 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mt-4 md:mt-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Project Status</p>
              <p className="text-sm font-semibold truncate">
                {PROJECT_STATUS_FLOW.find(s => s.key === primaryProject?.status)?.label || 'Pending'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-info/10 shrink-0">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Next Action</p>
              <p className="text-sm font-semibold truncate">Site Visit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-success/10 shrink-0">
              <IndianRupee className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-sm font-semibold">{formatCurrency(0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-warning/10 shrink-0">
              <Shield className="h-5 w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Warranty</p>
              <p className="text-sm font-semibold">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {projects?.map((project) => {
        const projStatusIndex = getStatusIndex(project.status);
        const projProgress = ((projStatusIndex + 1) / PROJECT_STATUS_FLOW.length) * 100;

        return (
          <div key={project.id} className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Project Status Card with Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base md:text-lg">{project.project_name}</CardTitle>
                    <CardDescription className="text-xs">ID: {project.id.slice(0, 8).toUpperCase()}</CardDescription>
                  </div>
                  <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                    {PROJECT_STATUS_FLOW.find(s => s.key === project.status)?.label || project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground text-xs">Overall Progress</span>
                    <span className="font-medium text-xs">{Math.round(projProgress)}%</span>
                  </div>
                  <Progress value={projProgress} className="h-2" />
                </div>

                {/* Status Timeline - Horizontal scroll on mobile */}
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-muted-foreground">Status Timeline</h4>
                  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex md:grid md:grid-cols-5 gap-2 min-w-max md:min-w-0">
                      {PROJECT_STATUS_FLOW.slice(0, 10).map((status, index) => {
                        const isCompleted = index <= projStatusIndex;
                        const isCurrent = index === projStatusIndex;
                        
                        return (
                          <div 
                            key={status.key}
                            className={`flex flex-col items-center p-2 md:p-3 rounded-lg text-center transition-colors min-w-[80px] ${
                              isCurrent 
                                ? 'bg-primary/10 border-2 border-primary' 
                                : isCompleted 
                                  ? 'bg-muted' 
                                  : 'bg-muted/30'
                            }`}
                          >
                            <span className="text-lg md:text-2xl mb-1">{status.icon}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-primary mb-1" />
                            ) : (
                              <Circle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mb-1" />
                            )}
                            <span className={`text-[10px] md:text-xs ${isCompleted ? 'font-medium' : 'text-muted-foreground'}`}>
                              {status.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">System Capacity</p>
                      <p className="text-lg font-bold">{project.capacity_kw || '-'} kW</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <IndianRupee className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold">{formatCurrency(project.total_amount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-lg font-bold">{formatDate(project.start_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Expected End</p>
                      <p className="text-lg font-bold">{formatDate(project.expected_end_date)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Installation Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Installation Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm font-medium">{project.leads?.address || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{project.leads?.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{project.leads?.email || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {['Quotation', 'Invoice', 'Completion Report', 'Warranty Certificate'].map((doc) => (
                    <Button key={doc} variant="outline" className="justify-start gap-2 text-sm h-auto py-3">
                      <Download className="h-4 w-4" />
                      <span className="truncate">{doc}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {projects.length > 1 && <Separator className="my-6" />}
          </div>
        );
      })}

      {/* Support Card */}
      <Card className="bg-muted/50 mt-4 md:mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Our support team is here to assist you.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
