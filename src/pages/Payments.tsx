import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, TrendingUp, Clock, AlertCircle, Plus, Loader2 } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type PaymentType = Database["public"]["Enums"]["payment_type"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (status: string | null) => {
  switch (status) {
    case "completed":
      return "status-completed";
    case "pending":
      return "status-in-progress";
    case "partial":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

const formatStatus = (status: string | null) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatPaymentType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const Payments = () => {
  const { payments, isLoading, createPayment } = usePayments();
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { user } = useAuth();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_type: "" as PaymentType | "",
    status: "pending" as PaymentStatus,
    project_id: "",
    lead_id: "",
    payment_method: "",
    transaction_ref: "",
    received_date: "",
    notes: "",
  });

  // Calculate stats
  const totalReceived = payments
    ?.filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0) || 0;
  
  const totalPending = payments
    ?.filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const pendingCount = payments?.filter((p) => p.status === "pending").length || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.payment_type) return;
    
    setIsSubmitting(true);
    try {
      await createPayment.mutateAsync({
        amount: parseFloat(formData.amount),
        payment_type: formData.payment_type as PaymentType,
        status: formData.status,
        project_id: formData.project_id || null,
        lead_id: formData.lead_id || null,
        payment_method: formData.payment_method || null,
        transaction_ref: formData.transaction_ref || null,
        received_date: formData.received_date || null,
        notes: formData.notes || null,
        recorded_by: user?.id,
      });
      
      setIsAddDialogOpen(false);
      setFormData({
        amount: "",
        payment_type: "",
        status: "pending",
        project_id: "",
        lead_id: "",
        payment_method: "",
        transaction_ref: "",
        received_date: "",
        notes: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Payments">
      {/* Stats */}
      <div className="mb-6 grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Received"
          value={formatCurrency(totalReceived)}
          change="Completed payments"
          changeType="neutral"
          icon={DollarSign}
          iconBg="bg-success/10"
        />
        <StatCard
          title="Pending"
          value={formatCurrency(totalPending)}
          change={`${pendingCount} payment${pendingCount !== 1 ? "s" : ""}`}
          changeType="neutral"
          icon={Clock}
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Total Payments"
          value={String(payments?.length || 0)}
          change="All time"
          changeType="neutral"
          icon={TrendingUp}
          iconBg="bg-primary/10"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(
            payments
              ?.filter((p) => {
                const date = new Date(p.created_at || "");
                const now = new Date();
                return (
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear()
                );
              })
              .reduce((sum, p) => sum + p.amount, 0) || 0
          )}
          change="Current month"
          changeType="neutral"
          icon={AlertCircle}
          iconBg="bg-destructive/10"
        />
      </div>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payment History</h2>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !payments?.length ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No payments recorded yet.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record your first payment
            </Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Project / Lead</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="font-medium text-foreground">
                    {(payment as any).projects?.project_name ||
                      (payment as any).leads?.customer_name ||
                      "N/A"}
                  </td>
                  <td>{formatPaymentType(payment.payment_type)}</td>
                  <td className="text-muted-foreground">
                    {payment.payment_method || "-"}
                  </td>
                  <td className="font-semibold text-foreground">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(payment.status)}`}>
                      {formatStatus(payment.status)}
                    </span>
                  </td>
                  <td className="text-muted-foreground">
                    {formatDate(payment.received_date || payment.created_at)}
                  </td>
                  <td className="text-muted-foreground">
                    {payment.transaction_ref || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type *</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_type: value as PaymentType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lead</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lead_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads?.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, payment_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as PaymentStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="received_date">Received Date</Label>
                <Input
                  id="received_date"
                  type="date"
                  value={formData.received_date}
                  onChange={(e) =>
                    setFormData({ ...formData, received_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_ref">Transaction Reference</Label>
                <Input
                  id="transaction_ref"
                  value={formData.transaction_ref}
                  onChange={(e) =>
                    setFormData({ ...formData, transaction_ref: e.target.value })
                  }
                  placeholder="e.g., TXN123456"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Payments;
