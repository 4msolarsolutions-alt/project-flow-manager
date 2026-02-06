import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { format, addYears } from "date-fns";
import { 
  Shield, 
  Loader2, 
  CheckCircle2, 
  Sun,
  Battery,
  Cpu,
  Download,
  Phone,
  Calendar
} from "lucide-react";

export default function CustomerWarranty() {
  const { projects, isLoading } = useCustomerProjects();

  const project = projects?.[0];

  // Default warranty periods (years)
  const warrantyDetails = [
    {
      component: "Solar Panels",
      icon: Sun,
      performanceYears: 25,
      productYears: 12,
      description: "Performance warranty guarantees minimum power output"
    },
    {
      component: "Inverter",
      icon: Cpu,
      performanceYears: 0,
      productYears: 5,
      description: "Manufacturer warranty covers defects and malfunctions"
    },
    {
      component: "Battery (if applicable)",
      icon: Battery,
      performanceYears: 0,
      productYears: 10,
      description: "Covers battery capacity and performance"
    },
    {
      component: "Workmanship",
      icon: Shield,
      performanceYears: 0,
      productYears: 5,
      description: "Installation and workmanship quality guarantee"
    }
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const getWarrantyEndDate = (startDate: string | null, years: number) => {
    if (!startDate || years === 0) return null;
    return addYears(new Date(startDate), years);
  };

  const isWarrantyActive = (startDate: string | null, years: number) => {
    if (!startDate || years === 0) return false;
    const endDate = getWarrantyEndDate(startDate, years);
    return endDate && endDate > new Date();
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

  const installationDate = project?.actual_end_date || project?.start_date;

  return (
    <AppLayout title="Warranty">
      <div className="space-y-6">
        {/* Warranty Status Banner */}
        <Card className="bg-success/10 border-success/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/20">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-success">Warranty Active</h2>
                <p className="text-success/80">
                  Your solar system is covered under manufacturer and workmanship warranties
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Warranty Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {warrantyDetails.map((warranty) => {
            const Icon = warranty.icon;
            const productActive = isWarrantyActive(installationDate, warranty.productYears);
            const performanceActive = isWarrantyActive(installationDate, warranty.performanceYears);
            const productEndDate = getWarrantyEndDate(installationDate, warranty.productYears);
            const performanceEndDate = getWarrantyEndDate(installationDate, warranty.performanceYears);

            return (
              <Card key={warranty.component}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{warranty.component}</CardTitle>
                    </div>
                    {(productActive || performanceActive) && (
                      <Badge className="bg-success/20 text-success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">{warranty.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warranty.productYears > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Product Warranty</span>
                      <span className="font-medium">
                        {warranty.productYears} years 
                        {productEndDate && (
                          <span className="text-muted-foreground ml-1">
                            (until {format(productEndDate, "MMM yyyy")})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {warranty.performanceYears > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Performance Warranty</span>
                      <span className="font-medium">
                        {warranty.performanceYears} years
                        {performanceEndDate && (
                          <span className="text-muted-foreground ml-1">
                            (until {format(performanceEndDate, "MMM yyyy")})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

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
