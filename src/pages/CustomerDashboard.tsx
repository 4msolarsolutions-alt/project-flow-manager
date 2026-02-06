import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { useProjectStages, STAGE_ICONS } from "@/hooks/useProjectStages";
import { useCustomerPayments } from "@/hooks/useCustomerPayments";
import { useWarranties } from "@/hooks/useWarranties";
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
  CreditCard,
  ArrowRight
} from "lucide-react";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { projects, isLoading: projectsLoading, hasProjects } = useCustomerProjects();
  
  const project = projects?.[0];
  const { stages, progressPercent, currentStage, isLoading: stagesLoading } = useProjectStages(project?.id);
  const { summary, isLoading: paymentsLoading } = useCustomerPayments(project?.id);
  const { activeWarranties, isLoading: warrantiesLoading } = useWarranties(project?.id);

  const isLoading = projectsLoading || stagesLoading;

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "₹0";
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  // Redirect to waiting page if no project
  useEffect(() => {
    if (!projectsLoading && !hasProjects) {
      navigate("/waiting-for-project");
    }
  }, [projectsLoading, hasProjects, navigate]);

  if (isLoading) {
    return (
      <AppLayout title="My Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return null; // Will redirect to waiting page
  }

  return (
    <AppLayout title="My Dashboard">
      {/* Welcome Banner */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                Welcome, {project?.leads?.customer_name || profile?.first_name}!
              </h2>
              <p className="text-primary-foreground/80 mt-1 text-sm md:text-base">
                Track your solar installation progress below
              </p>
            </div>
            {project && (
              <Badge variant="secondary" className="w-fit text-sm px-4 py-2">
                {project.capacity_kw} kW System
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mt-4 md:mt-6">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/project")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Project Status</p>
              <p className="text-sm font-semibold truncate">
                {currentStage?.stage_name || 'In Progress'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/payments")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
              <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(summary.amountPaid)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/payments")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(summary.pendingAmount)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/warranty")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Warranties</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{activeWarranties} Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Card with Timeline */}
      <Card className="mt-4 md:mt-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base md:text-lg">{project.project_name}</CardTitle>
              <CardDescription className="text-xs">ID: {project.id.slice(0, 8).toUpperCase()}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/customer/project")}>
              View Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground text-xs">Overall Progress</span>
              <span className="font-medium text-xs">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Status Timeline - Horizontal scroll on mobile */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-muted-foreground">Status Timeline</h4>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex md:grid md:grid-cols-5 gap-2 min-w-max md:min-w-0">
                {stages?.slice(0, 10).map((stage) => {
                  const isCompleted = stage.is_completed;
                  const isCurrent = currentStage?.id === stage.id;
                  const icon = STAGE_ICONS[stage.stage_key] || '📌';
                  
                  return (
                    <div 
                      key={stage.id}
                      className={`flex flex-col items-center p-2 md:p-3 rounded-lg text-center transition-colors min-w-[80px] ${
                        isCurrent 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : isCompleted 
                            ? 'bg-muted' 
                            : 'bg-muted/30'
                      }`}
                    >
                      <span className="text-lg md:text-2xl mb-1">{icon}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-primary mb-1" />
                      ) : (
                        <Circle className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground mb-1" />
                      )}
                      <span className={`text-[10px] md:text-xs ${isCompleted ? 'font-medium' : 'text-muted-foreground'}`}>
                        {stage.stage_name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4 md:mt-6">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/project")}>
          <CardContent className="pt-6 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">My Project</h3>
            <p className="text-xs text-muted-foreground">View details & timeline</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/payments")}>
          <CardContent className="pt-6 text-center">
            <IndianRupee className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">Payments</h3>
            <p className="text-xs text-muted-foreground">Track payment history</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/documents")}>
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">Documents</h3>
            <p className="text-xs text-muted-foreground">Download project files</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/customer/support")}>
          <CardContent className="pt-6 text-center">
            <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">Support</h3>
            <p className="text-xs text-muted-foreground">Get help & raise tickets</p>
          </CardContent>
        </Card>
      </div>

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
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("tel:+919876543210")}>
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/customer/support")}>
                <Mail className="h-4 w-4" />
                Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
