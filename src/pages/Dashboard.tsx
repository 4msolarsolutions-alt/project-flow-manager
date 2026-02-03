import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { ProjectProgress } from "@/components/dashboard/ProjectProgress";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { Users, FolderKanban, Zap, DollarSign } from "lucide-react";

const Dashboard = () => {
  return (
    <Layout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={142}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconBg="bg-info/10"
        />
        <StatCard
          title="Active Projects"
          value={28}
          change="+4 new this week"
          changeType="positive"
          icon={FolderKanban}
          iconBg="bg-success/10"
        />
        <StatCard
          title="Installed Capacity"
          value="2.4 MW"
          change="+350 KW this month"
          changeType="positive"
          icon={Zap}
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Revenue (YTD)"
          value="₹4.2 Cr"
          change="+18% vs last year"
          changeType="positive"
          icon={DollarSign}
          iconBg="bg-primary/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RecentLeads />
        <ProjectProgress />
      </div>

      {/* Tasks Section */}
      <div className="mt-6">
        <UpcomingTasks />
      </div>
    </Layout>
  );
};

export default Dashboard;
