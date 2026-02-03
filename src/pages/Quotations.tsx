import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, FileText, Download, Send } from "lucide-react";

const quotationsData = [
  {
    id: "QT-2025-001",
    lead: "Rajesh Kumar",
    systemKW: "5 KW",
    amount: "₹3,25,000",
    status: "Draft",
    createdAt: "Jan 30, 2025",
    validUntil: "Feb 28, 2025",
  },
  {
    id: "QT-2025-002",
    lead: "Priya Sharma",
    systemKW: "25 KW",
    amount: "₹15,50,000",
    status: "Sent",
    createdAt: "Jan 28, 2025",
    validUntil: "Feb 27, 2025",
  },
  {
    id: "QT-2025-003",
    lead: "Amit Patel",
    systemKW: "100 KW",
    amount: "₹58,00,000",
    status: "Under Review",
    createdAt: "Jan 25, 2025",
    validUntil: "Feb 24, 2025",
  },
  {
    id: "QT-2025-004",
    lead: "Kiran Industries",
    systemKW: "250 KW",
    amount: "₹1,35,00,000",
    status: "Accepted",
    createdAt: "Jan 22, 2025",
    validUntil: "Feb 21, 2025",
  },
  {
    id: "QT-2025-005",
    lead: "Green Homes Society",
    systemKW: "75 KW",
    amount: "₹42,00,000",
    status: "Accepted",
    createdAt: "Jan 20, 2025",
    validUntil: "Feb 19, 2025",
  },
  {
    id: "QT-2024-098",
    lead: "Metro Rail Corporation",
    systemKW: "300 KW",
    amount: "₹1,65,00,000",
    status: "Expired",
    createdAt: "Dec 15, 2024",
    validUntil: "Jan 14, 2025",
  },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case "Draft":
      return "status-new";
    case "Sent":
    case "Under Review":
      return "status-in-progress";
    case "Accepted":
      return "status-completed";
    case "Rejected":
    case "Expired":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

const Quotations = () => {
  return (
    <Layout title="Quotations">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          {quotationsData.length} quotations
        </p>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      {/* Quotations Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        <table className="data-table">
          <thead>
            <tr>
              <th>Quotation ID</th>
              <th>Lead</th>
              <th>System Size</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Valid Until</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {quotationsData.map((quotation) => (
              <tr key={quotation.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{quotation.id}</span>
                  </div>
                </td>
                <td className="text-foreground">{quotation.lead}</td>
                <td className="font-medium">{quotation.systemKW}</td>
                <td className="font-semibold text-foreground">{quotation.amount}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(quotation.status)}`}>
                    {quotation.status}
                  </span>
                </td>
                <td className="text-muted-foreground">{quotation.createdAt}</td>
                <td className="text-muted-foreground">{quotation.validUntil}</td>
                <td>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <FileText className="h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Send className="h-4 w-4" />
                        Send to Customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Quotations;
