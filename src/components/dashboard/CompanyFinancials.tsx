import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/useProjects";
import { useExpenses } from "@/hooks/useExpenses";
import { usePayroll } from "@/hooks/usePayroll";
import { usePayments } from "@/hooks/usePayments";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Building2,
  BarChart3,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function CompanyFinancials() {
  const { projects } = useProjects();
  const { expenses } = useExpenses();
  const { payrollRecords } = usePayroll();
  const { payments } = usePayments();

  // Total Revenue = sum of all received payments
  const totalRevenue =
    payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

  // Total project revenue (quoted/contract value)
  const totalProjectRevenue =
    projects?.reduce((sum, p) => sum + (Number((p as any).project_revenue) || Number(p.total_amount) || 0), 0) || 0;

  // Total Expense from project cost tracking
  const totalExpense =
    projects?.reduce((sum, p) => {
      const proj = p as any;
      return (
        sum +
        (Number(proj.total_labor_cost) || 0) +
        (Number(proj.total_food_cost) || 0) +
        (Number(proj.total_travel_cost) || 0) +
        (Number(proj.total_material_cost) || 0) +
        (Number(proj.total_other_cost) || 0)
      );
    }, 0) || 0;

  // Net Profit
  const netProfit = totalRevenue - totalExpense;

  // Current month payroll
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthPayroll =
    payrollRecords
      ?.filter((p) => p.month === currentMonth && p.year === currentYear)
      .reduce((sum, p) => sum + (Number(p.total_payable) || 0), 0) || 0;

  // Company general expenses (scope = company)
  const companyExpenses =
    expenses
      ?.filter((e) => (e as any).expense_scope === "company" && e.status === "approved")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

  // Project expenses (scope = project, approved)
  const projectExpenses =
    expenses
      ?.filter((e) => (e as any).expense_scope !== "company" && e.status === "approved")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

  const cards = [
    {
      title: "Total Revenue",
      value: fmt(totalRevenue),
      sub: `Contract value: ${fmt(totalProjectRevenue)}`,
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Total Expense",
      value: fmt(totalExpense + companyExpenses),
      sub: `Project: ${fmt(totalExpense)} | Company: ${fmt(companyExpenses)}`,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Net Profit",
      value: fmt(netProfit),
      sub: totalRevenue > 0
        ? `Margin: ${((netProfit / totalRevenue) * 100).toFixed(1)}%`
        : "No revenue yet",
      icon: netProfit >= 0 ? TrendingUp : TrendingDown,
      color: netProfit >= 0 ? "text-success" : "text-destructive",
      bg: netProfit >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
    {
      title: "Salary Payout (This Month)",
      value: fmt(monthPayroll),
      sub: `${payrollRecords?.filter((p) => p.month === currentMonth && p.year === currentYear).length || 0} employees`,
      icon: Wallet,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Project Expenses",
      value: fmt(projectExpenses),
      sub: "Approved project expenses",
      icon: BarChart3,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Company Overhead",
      value: fmt(companyExpenses),
      sub: "General company expenses",
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="flex items-start gap-3 p-4 md:p-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} shrink-0`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className="text-lg md:text-xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground truncate">{card.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
