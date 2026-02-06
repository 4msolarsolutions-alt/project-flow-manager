import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerProjects, PROJECT_STATUS_FLOW, getStatusIndex } from "@/hooks/useCustomerProjects";
import { format } from "date-fns";
import { 
  Sun, 
  LogOut, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Zap, 
  IndianRupee,
  CheckCircle2,
  Circle,
  Loader2
} from "lucide-react";

export default function CustomerDashboard() {
  const { signOut, profile } = useAuth();
  const { projects, isLoading } = useCustomerProjects();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const primaryProject = projects?.[0];
  const statusIndex = getStatusIndex(primaryProject?.status);
  const progressPercent = ((statusIndex + 1) / PROJECT_STATUS_FLOW.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sun className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">4M Solar Solutions</h1>
              <p className="text-xs text-muted-foreground">Customer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {primaryProject?.leads?.customer_name || profile?.first_name}!
                </h2>
                <p className="text-primary-foreground/80 mt-1">
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

        {projects?.map((project) => {
          const projStatusIndex = getStatusIndex(project.status);
          const projProgress = ((projStatusIndex + 1) / PROJECT_STATUS_FLOW.length) * 100;

          return (
            <div key={project.id} className="space-y-6">
              {/* Project Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>{project.project_name}</CardTitle>
                      <CardDescription>Project ID: {project.id.slice(0, 8).toUpperCase()}</CardDescription>
                    </div>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {PROJECT_STATUS_FLOW.find(s => s.key === project.status)?.label || project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">{Math.round(projProgress)}%</span>
                    </div>
                    <Progress value={projProgress} className="h-3" />
                  </div>

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Status Timeline</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {PROJECT_STATUS_FLOW.slice(0, 10).map((status, index) => {
                        const isCompleted = index <= projStatusIndex;
                        const isCurrent = index === projStatusIndex;
                        
                        return (
                          <div 
                            key={status.key}
                            className={`flex flex-col items-center p-3 rounded-lg text-center transition-colors ${
                              isCurrent 
                                ? 'bg-primary/10 border-2 border-primary' 
                                : isCompleted 
                                  ? 'bg-muted' 
                                  : 'bg-muted/30'
                            }`}
                          >
                            <span className="text-2xl mb-1">{status.icon}</span>
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-primary mb-1" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground mb-1" />
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

              {/* Project Details Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">System Capacity</p>
                        <p className="text-xl font-bold">{project.capacity_kw || '-'} kW</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IndianRupee className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold">{formatCurrency(project.total_amount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="text-xl font-bold">{formatDate(project.start_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Completion</p>
                        <p className="text-xl font-bold">{formatDate(project.expected_end_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact & Location Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Installation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Installation Address</p>
                        <p className="font-medium">{project.leads?.address || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Number</p>
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
                  </div>
                </CardContent>
              </Card>

              {projects.length > 1 && <Separator className="my-8" />}
            </div>
          );
        })}

        {/* Support Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-semibold">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Our support team is here to assist you with any questions.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Support
                </Button>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
