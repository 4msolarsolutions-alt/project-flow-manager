import { MoreHorizontal, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const leads = [
  {
    id: 1,
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    address: "Sector 15, Noida",
    type: "Residential",
    status: "New",
    kw: "5 KW",
  },
  {
    id: 2,
    name: "Priya Sharma",
    phone: "+91 87654 32109",
    address: "DLF Phase 3, Gurugram",
    type: "Commercial",
    status: "Site Visit Scheduled",
    kw: "25 KW",
  },
  {
    id: 3,
    name: "Amit Patel",
    phone: "+91 76543 21098",
    address: "Vashi, Navi Mumbai",
    type: "Industrial",
    status: "Quotation Sent",
    kw: "100 KW",
  },
  {
    id: 4,
    name: "Sunita Verma",
    phone: "+91 65432 10987",
    address: "Whitefield, Bangalore",
    type: "Residential",
    status: "Negotiation",
    kw: "10 KW",
  },
];

const getStatusClass = (status) => {
  switch (status) {
    case "New":
      return "status-new";
    case "Site Visit Scheduled":
      return "status-in-progress";
    case "Quotation Sent":
      return "status-in-progress";
    case "Negotiation":
      return "status-in-progress";
    case "Won":
      return "status-completed";
    case "Lost":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

export function RecentLeads() {
  return (
    <div className="rounded-xl bg-card border border-border animate-fade-in">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Recent Leads</h3>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lead.address}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="text-sm text-muted-foreground">{lead.type}</span>
                </td>
                <td>
                  <span className="font-medium">{lead.kw}</span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(lead.status)}`}>
                    {lead.status}
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
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Schedule Visit</DropdownMenuItem>
                      <DropdownMenuItem>Create Quotation</DropdownMenuItem>
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
