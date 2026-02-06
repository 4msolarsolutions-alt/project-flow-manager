import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { useWarranties } from "@/hooks/useWarranties";
import { format } from "date-fns";
import { 
  Shield, 
  Loader2, 
  CheckCircle2, 
  Sun,
  Battery,
  Cpu,
  Download,
  Phone,
  Calendar,
  AlertTriangle,
  Wrench,
  XCircle
} from "lucide-react";

export default function CustomerWarranty() {
  const { projects, isLoading: projectsLoading } = useCustomerProjects();
  const project = projects?.[0];

  const { warranties, isLoading: warrantiesLoading, activeWarranties, expiringWarranties } = useWarranties(project?.id);

  const isLoading = projectsLoading || warrantiesLoading;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "dd MMM yyyy");
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'panel':
        return Sun;
      case 'inverter':
        return Cpu;
      case 'battery':
        return Battery;
      case 'workmanship':
        return Wrench;
      default:
        return Shield;
    }
  };

  const getComponentLabel = (type: string) => {
    const labels: Record<string, string> = {
      panel: 'Solar Panels',
      inverter: 'Inverter',
      battery: 'Battery',
      workmanship: 'Installation & Workmanship',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Warranty">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Warranty">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p className="text-lg font-medium">Your project is not yet activated</p>
            <p className="text-sm mt-2">Please contact support for assistance.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const installationDate = project?.actual_end_date || project?.start_date;

  return (
    <AppLayout title="Warranty">
      <div className="space-y-6">
        {/* Warranty Overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Warranties</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeWarranties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Within 30 Days</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{expiringWarranties}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Installation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium">{project?.project_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Size</p>
                <p className="font-medium">{project?.capacity_kw || '-'} kW</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Installation Date</p>
                <p className="font-medium">{formatDate(installationDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Cards from Database */}
        {warranties && warranties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {warranties.map((warranty) => {
              const Icon = getComponentIcon(warranty.component_type);

              return (
                <Card key={warranty.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{getComponentLabel(warranty.component_type)}</CardTitle>
                          {warranty.brand_name && (
                            <CardDescription>
                              {warranty.brand_name} {warranty.model_name && `- ${warranty.model_name}`}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(warranty.productStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {warranty.product_warranty_years > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Product Warranty</span>
                        <span className="font-medium">
                          {warranty.product_warranty_years} years 
                          {warranty.productEndDate && (
                            <span className="text-muted-foreground ml-1">
                              (until {format(warranty.productEndDate, "MMM yyyy")})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {warranty.performance_warranty_years && warranty.performance_warranty_years > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Performance Warranty</span>
                        <span className="font-medium">
                          {warranty.performance_warranty_years} years
                          {warranty.performanceEndDate && (
                            <span className="text-muted-foreground ml-1">
                              (until {format(warranty.performanceEndDate, "MMM yyyy")})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {warranty.daysUntilProductExpiry !== null && warranty.daysUntilProductExpiry > 0 && (
                      <p className="text-xs text-primary">
                        {warranty.daysUntilProductExpiry} days remaining on product warranty
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">No warranty information yet</h3>
              <p className="text-sm text-muted-foreground">
                Warranty details will be added once your installation is complete
              </p>
            </CardContent>
          </Card>
        )}

        {/* Support Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold">Need warranty support?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for warranty claims or technical assistance.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Warranty Card
                </Button>
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
