import { MoreHorizontal, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLeads } from "@/hooks/useLeads";
import { useNavigate } from "react-router-dom";

const getStatusClass = (status: string) => {
  switch (status) {
    case "new_call":
      return "status-new";
    case "site_visit_required":
    case "site_visit_assigned":
    case "site_visit_completed":
    case "quotation_prepared":
    case "quote_sent":
      return "status-in-progress";
    case "customer_approved":
    case "payment_received":
    case "completed":
      return "status-completed";
    case "cancelled":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

const formatStatus = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function RecentLeads() {
  const { leads, isLoading } = useLeads();
  const navigate = useNavigate();
  
  const recentLeads = leads?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">Recent Leads</h3>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (recentLeads.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">Recent Leads</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            Add Lead
          </Button>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          No leads yet. Start by adding your first lead.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border animate-fade-in">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Recent Leads</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
          View All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div>
                    <p className="font-medium text-foreground">{lead.customer_name}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lead.city || lead.address}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-sm text-muted-foreground capitalize">{lead.project_type}</span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(lead.status)}`}>
                    {formatStatus(lead.status)}
                  </span>
                </td>
                <td>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate('/leads')}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/site-visits')}>Schedule Visit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/quotations')}>Create Quotation</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
