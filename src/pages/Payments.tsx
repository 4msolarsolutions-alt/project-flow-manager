import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, TrendingUp, Clock, AlertCircle, Plus } from "lucide-react";

const paymentsData = [
  {
    id: 1,
    project: "Green Valley Apartments",
    customer: "Green Valley Housing Society",
    amount: "₹25,00,000",
    type: "Milestone Payment",
    status: "Received",
    date: "Jan 28, 2025",
    milestone: "50% Completion",
  },
  {
    id: 2,
    project: "Tech Park Phase 2",
    customer: "TechPark Infra Pvt Ltd",
    amount: "₹50,00,000",
    type: "Advance Payment",
    status: "Received",
    date: "Jan 5, 2025",
    milestone: "Project Start",
  },
  {
    id: 3,
    project: "Sharma Residence",
    customer: "Mr. Suresh Sharma",
    amount: "₹2,00,000",
    type: "Final Payment",
    status: "Pending",
    date: "Feb 10, 2025",
    milestone: "Project Completion",
  },
  {
    id: 4,
    project: "Industrial Complex B",
    customer: "Kiran Industries",
    amount: "₹67,50,000",
    type: "Advance Payment",
    status: "Overdue",
    date: "Jan 25, 2025",
    milestone: "50% Advance",
  },
  {
    id: 5,
    project: "City Mall Rooftop",
    customer: "City Mall Management",
    amount: "₹15,00,000",
    type: "Final Payment",
    status: "Received",
    date: "Jan 20, 2025",
    milestone: "Project Handover",
  },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case "Received":
      return "status-completed";
    case "Pending":
      return "status-in-progress";
    case "Overdue":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

const Payments = () => {
  return (
    <Layout title="Payments">
      {/* Stats */}
      <div className="mb-6 grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Received"
          value="₹90,00,000"
          change="This month"
          changeType="neutral"
          icon={DollarSign}
          iconBg="bg-success/10"
        />
        <StatCard
          title="Pending"
          value="₹2,00,000"
          change="1 payment"
          changeType="neutral"
          icon={Clock}
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Overdue"
          value="₹67,50,000"
          change="1 payment"
          changeType="negative"
          icon={AlertCircle}
          iconBg="bg-destructive/10"
        />
        <StatCard
          title="This Quarter"
          value="₹1,59,50,000"
          change="+24% vs last quarter"
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-primary/10"
        />
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payment History</h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Customer</th>
              <th>Milestone</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {paymentsData.map((payment) => (
              <tr key={payment.id}>
                <td className="font-medium text-foreground">{payment.project}</td>
                <td className="text-muted-foreground">{payment.customer}</td>
                <td className="text-muted-foreground">{payment.milestone}</td>
                <td>{payment.type}</td>
                <td className="font-semibold text-foreground">{payment.amount}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="text-muted-foreground">{payment.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Payments;
