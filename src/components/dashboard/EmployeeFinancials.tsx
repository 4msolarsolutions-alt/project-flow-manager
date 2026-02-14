import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { useExpenses } from "@/hooks/useExpenses";
import { usePayroll } from "@/hooks/usePayroll";
import {
  Clock,
  Wallet,
  UtensilsCrossed,
  Car,
  AlertCircle,
  Banknote,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function EmployeeFinancials() {
  const { user } = useAuth();
  const { timeLogs } = useTimeLogs();
  const { expenses } = useExpenses();
  const { payrollRecords } = usePayroll();

  const myLogs = timeLogs?.filter((l) => l.user_id === user?.id) || [];
  const myExpenses = expenses?.filter((e) => (e as any).submitted_by === user?.id) || [];

  // Total hours worked (all completed project logs)
  const totalHours = myLogs
    .filter((l) => l.status === "completed")
    .reduce((s, l) => s + (Number(l.total_hours) || 0), 0);

  // Current month payroll
  const now = new Date();
  const myPayroll = payrollRecords?.find(
    (p) => p.user_id === user?.id && p.month === now.getMonth() + 1 && p.year === now.getFullYear()
  );

  // Food & travel from approved expenses
  const approvedFood = myExpenses
    .filter((e) => e.expense_type === "food" && e.status === "approved")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const approvedTravel = myExpenses
    .filter((e) => e.expense_type === "travel" && e.status === "approved")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Pending expenses
  const pendingAmount = myExpenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Salary from payroll
  const salary = myPayroll ? Number(myPayroll.total_payable) || 0 : 0;

  const cards = [
    {
      title: "Hours Worked",
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Salary",
      value: myPayroll ? fmt(salary) : "—",
      icon: Banknote,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Food Paid",
      value: fmt(approvedFood),
      icon: UtensilsCrossed,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Travel Paid",
      value: fmt(approvedTravel),
      icon: Car,
      color: "text-accent-foreground",
      bg: "bg-accent/50",
    },
    {
      title: "Pending",
      value: fmt(pendingAmount),
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Net Payroll",
      value: myPayroll ? fmt(salary) : "—",
      icon: Wallet,
      color: "text-success",
      bg: "bg-success/10",
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
