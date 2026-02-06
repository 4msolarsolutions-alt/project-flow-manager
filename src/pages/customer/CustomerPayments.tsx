import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  IndianRupee, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  CreditCard
} from "lucide-react";

export default function CustomerPayments() {
  const { projects, isLoading: projectsLoading } = useCustomerProjects();
  const projectIds = projects?.map(p => p.id) || [];

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['customer-payments', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('project_id', projectIds)
        .order('received_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });

  const isLoading = projectsLoading || paymentsLoading;

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/20 text-success"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'partial':
        return <Badge className="bg-warning/20 text-warning"><AlertCircle className="h-3 w-3 mr-1" />Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'advance':
        return <Badge variant="outline">Advance</Badge>;
      case 'progress':
        return <Badge variant="outline">Progress</Badge>;
      case 'final':
        return <Badge variant="outline">Final</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Calculate totals
  const totalAmount = projects?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const pendingAmount = totalAmount - totalPaid;

  if (isLoading) {
    return (
      <AppLayout title="Payments">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Payments">
      <div className="space-y-6">
        {/* Payment Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <IndianRupee className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Project Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(pendingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              All payments made towards your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.received_date)}</TableCell>
                      <TableCell>{getPaymentTypeBadge(payment.payment_type)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method || '-'}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.transaction_ref || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payments recorded yet</p>
                <p className="text-sm">Payment records will appear here once processed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold">Need to make a payment?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our accounts team for payment details and assistance.
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
