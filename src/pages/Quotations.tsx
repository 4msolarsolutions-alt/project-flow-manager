import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, FileText, Download, Send, Loader2, MessageCircle, Eye, Edit2 } from "lucide-react";
import { useQuotations } from "@/hooks/useQuotations";
import { generateQuotationPdf } from "@/utils/quotationPdf";
import { shareQuotationViaWhatsApp } from "@/utils/whatsappShare";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const getStatusClass = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-blue-500/20 text-blue-500";
    case "sent":
      return "bg-yellow-500/20 text-yellow-500";
    case "approved":
      return "bg-green-500/20 text-green-500";
    case "rejected":
      return "bg-red-500/20 text-red-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getValidUntilDate = (createdAt: string | null, validityDays: number | null) => {
  if (!createdAt) return '-';
  const created = new Date(createdAt);
  created.setDate(created.getDate() + (validityDays || 15));
  return formatDate(created.toISOString());
};

const Quotations = () => {
  const { quotations, isLoading, sendQuotation } = useQuotations();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDownloadPdf = (quotation: any) => {
    generateQuotationPdf(quotation);
  };

  const handleSendQuotation = async (id: string) => {
    await sendQuotation.mutateAsync(id);
  };

  const handleWhatsAppShare = (quotation: any) => {
    if (!quotation.leads?.phone) {
      toast({
        title: "No Phone Number",
        description: "Customer phone number is not available for this quotation.",
        variant: "destructive",
      });
      return;
    }
    shareQuotationViaWhatsApp(quotation);
  };

  return (
    <Layout title="Quotations">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          {quotations?.length || 0} quotations
        </p>
        <Button className="gap-2" onClick={() => navigate('/leads')}>
          <Plus className="h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      {/* Quotations Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !quotations?.length ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No quotations yet.</p>
            <p className="text-sm text-muted-foreground">
              Create quotations from the Leads page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quotation ID</th>
                  <th>Customer</th>
                  <th>System Size</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Valid Until</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {quotation.quotation_number || `QT-${quotation.id.slice(0, 8).toUpperCase()}`}
                        </span>
                      </div>
                    </td>
                    <td className="text-foreground">
                      {(quotation as any).leads?.customer_name || 'N/A'}
                    </td>
                    <td className="font-medium">{quotation.system_kw || 0} kW</td>
                    <td className="font-semibold text-foreground">
                      {formatCurrency(quotation.total_amount)}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(quotation.status || 'draft')}`}>
                        {formatStatus(quotation.status || 'draft')}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{formatDate(quotation.created_at)}</td>
                    <td className="text-muted-foreground">
                      {getValidUntilDate(quotation.created_at, quotation.validity_days)}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => navigate(`/quotations/${quotation.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => navigate(`/quotations/${quotation.id}?edit=true`)}
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Quotation
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleDownloadPdf(quotation)}
                          >
                            <Download className="h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleWhatsAppShare(quotation)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            Share via WhatsApp
                          </DropdownMenuItem>
                          {quotation.status === 'draft' && (
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleSendQuotation(quotation.id)}
                            >
                              <Send className="h-4 w-4" />
                              Mark as Sent
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Quotations;
