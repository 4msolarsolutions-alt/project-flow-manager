import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
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
  User
} from "lucide-react";

export default function CustomerProject() {
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
      <AppLayout title="My Project">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const project = projects?.[0];

  if (!project) {
    return (
      <AppLayout title="My Project">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No project found
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const statusIndex = getStatusIndex(project.status);
  const progress = ((statusIndex + 1) / PROJECT_STATUS_FLOW.length) * 100;

  return (
    <AppLayout title="My Project">
      <div className="space-y-6">
        {/* Project Header */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">{project.project_name}</h2>
                <p className="text-primary-foreground/80 mt-1 text-sm">
                  Project ID: {project.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <Badge variant="secondary" className="w-fit text-sm px-4 py-2">
                {project.capacity_kw} kW System
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Status</CardTitle>
            <CardDescription>
              Current status: {PROJECT_STATUS_FLOW.find(s => s.key === project.status)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Status Timeline */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mt-6">
              <div className="flex md:grid md:grid-cols-5 gap-3 min-w-max md:min-w-0">
                {PROJECT_STATUS_FLOW.map((status, index) => {
                  const isCompleted = index <= statusIndex;
                  const isCurrent = index === statusIndex;
                  
                  return (
                    <div 
                      key={status.key}
                      className={`flex flex-col items-center p-3 rounded-lg text-center transition-colors min-w-[100px] ${
                        isCurrent 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : isCompleted 
                            ? 'bg-muted' 
                            : 'bg-muted/30'
                      }`}
                    >
                      <span className="text-2xl mb-2">{status.icon}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-primary mb-2" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground mb-2" />
                      )}
                      <span className={`text-xs ${isCompleted ? 'font-medium' : 'text-muted-foreground'}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{project.capacity_kw || '-'} kW</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">{formatCurrency(project.total_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(project.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Expected Completion</p>
                  <p className="font-medium">{formatDate(project.expected_end_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Installation Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{project.leads?.customer_name || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{project.leads?.address || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{project.leads?.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{project.leads?.email || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
