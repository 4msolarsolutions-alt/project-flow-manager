import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreHorizontal, Phone, MapPin, Calendar } from "lucide-react";

const leadsData = [
  {
    id: 1,
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh.k@email.com",
    address: "Sector 15, Noida, UP",
    type: "Residential",
    status: "New",
    capacity: "5 KW",
    createdAt: "Jan 28, 2025",
    assignedTo: "Vikram Singh",
  },
  {
    id: 2,
    name: "Priya Sharma",
    phone: "+91 87654 32109",
    email: "priya.s@business.com",
    address: "DLF Phase 3, Gurugram, HR",
    type: "Commercial",
    status: "Site Visit Scheduled",
    capacity: "25 KW",
    createdAt: "Jan 27, 2025",
    assignedTo: "Ananya Gupta",
  },
  {
    id: 3,
    name: "Amit Patel",
    phone: "+91 76543 21098",
    email: "amit.p@industry.com",
    address: "Vashi, Navi Mumbai, MH",
    type: "Industrial",
    status: "Quotation Sent",
    capacity: "100 KW",
    createdAt: "Jan 25, 2025",
    assignedTo: "Rohit Mehta",
  },
  {
    id: 4,
    name: "Sunita Verma",
    phone: "+91 65432 10987",
    email: "sunita.v@email.com",
    address: "Whitefield, Bangalore, KA",
    type: "Residential",
    status: "Negotiation",
    capacity: "10 KW",
    createdAt: "Jan 24, 2025",
    assignedTo: "Priya Sharma",
  },
  {
    id: 5,
    name: "Kiran Industries",
    phone: "+91 54321 09876",
    email: "contact@kiranindustries.com",
    address: "MIDC, Pune, MH",
    type: "Industrial",
    status: "Site Visit Done",
    capacity: "250 KW",
    createdAt: "Jan 22, 2025",
    assignedTo: "Vikram Singh",
  },
  {
    id: 6,
    name: "Green Homes Society",
    phone: "+91 43210 98765",
    email: "admin@greenhomes.com",
    address: "Electronic City, Bangalore, KA",
    type: "Commercial",
    status: "Won",
    capacity: "75 KW",
    createdAt: "Jan 20, 2025",
    assignedTo: "Ananya Gupta",
  },
];

const getStatusClass = (status: string) => {
  switch (status) {
    case "New":
      return "status-new";
    case "Site Visit Scheduled":
    case "Site Visit Done":
    case "Quotation Sent":
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

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Layout title="Leads">
      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="site-visit">Site Visit</SelectItem>
              <SelectItem value="quotation">Quotation</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {leadsData.map((lead) => (
                <tr key={lead.id} className="cursor-pointer">
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {lead.address}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {lead.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{lead.type}</span>
                  </td>
                  <td>
                    <span className="font-medium">{lead.capacity}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">{lead.assignedTo}</span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {lead.createdAt}
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
                        <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                        <DropdownMenuItem>Schedule Site Visit</DropdownMenuItem>
                        <DropdownMenuItem>Create Quotation</DropdownMenuItem>
                        <DropdownMenuItem>Convert to Project</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Leads;
