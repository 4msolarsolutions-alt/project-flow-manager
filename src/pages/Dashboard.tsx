import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { ProjectProgress } from "@/components/dashboard/ProjectProgress";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { CompanyFinancials } from "@/components/dashboard/CompanyFinancials";
import { ProjectFinancials } from "@/components/dashboard/ProjectFinancials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, Zap, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";

const Dashboard = () => {
  const { leads } = useLeads();
  const { projects } = useProjects();

  // Calculate real stats
  const totalLeads = leads?.length || 0;
  const activeProjects = projects?.filter(p => p.status && !['completed', 'cancelled'].includes(p.status)).length || 0;
  const delayedProjects = projects?.filter(p => p.status === 'delayed').length || 0;
  const totalCapacity = projects?.reduce((acc, p) => acc + (p.capacity_kw || 0), 0) || 0;

  return (
    <AppLayout title="Admin Dashboard">
      {/* Row 1 - KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={totalLeads}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconBg="bg-info/10"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          change={`${delayedProjects} delayed`}
          changeType={delayedProjects > 0 ? "negative" : "positive"}
          icon={FolderKanban}
          iconBg="bg-success/10"
        />
        <StatCard
          title="Pending Payments"
          value="₹2.4L"
          change="5 invoices pending"
          changeType="neutral"
          icon={DollarSign}
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Delayed Projects"
          value={delayedProjects}
          change={delayedProjects > 0 ? "Needs attention" : "All on track"}
          changeType={delayedProjects > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          iconBg="bg-destructive/10"
        />
      </div>

      {/* Company Financials */}
      <div className="mt-4 md:mt-6">
        <h2 className="text-lg font-semibold mb-3">Company Financials</h2>
        <CompanyFinancials />
      </div>

      {/* Row 2 - Charts */}
      <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 lg:grid-cols-2">
        <ProjectProgress />
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Expense vs Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Chart placeholder - Expense tracking coming soon
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Financial Table */}
      <div className="mt-4 md:mt-6">
        <ProjectFinancials />
      </div>

      {/* Row 3 - Tables */}
      <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 lg:grid-cols-2">
        <RecentLeads />
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Expense: Travel - ₹2,500</p>
                  <p className="text-xs text-muted-foreground">Rahul Kumar • 2 hours ago</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 bg-success/10 text-success rounded">Approve</button>
                  <button className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">Reject</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Payroll: January 2024</p>
                  <p className="text-xs text-muted-foreground">5 employees pending</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">Review</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 - Tasks */}
      <div className="mt-4 md:mt-6">
        <UpcomingTasks />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
