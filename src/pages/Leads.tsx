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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreHorizontal, Phone, MapPin, Calendar, Loader2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";

const getStatusClass = (status: string) => {
  switch (status) {
    case "new_call":
      return "bg-blue-500/20 text-blue-500";
    case "site_visit_required":
    case "site_visit_assigned":
      return "bg-yellow-500/20 text-yellow-500";
    case "site_visit_completed":
    case "quotation_prepared":
    case "quote_sent":
      return "bg-orange-500/20 text-orange-500";
    case "customer_approved":
    case "payment_received":
      return "bg-purple-500/20 text-purple-500";
    case "completed":
      return "bg-green-500/20 text-green-500";
    case "cancelled":
      return "bg-red-500/20 text-red-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const Leads = () => {
  const { leads, isLoading, createLead } = useLeads();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    project_type: "epc" as "epc" | "service" | "oam",
    lead_source: "",
    notes: "",
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createLead.mutateAsync({
        ...formData,
        created_by: user?.id,
      });
      
      setIsAddDialogOpen(false);
      setFormData({
        customer_name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        project_type: "epc",
        lead_source: "",
        notes: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new_call">New Call</SelectItem>
              <SelectItem value="site_visit_required">Site Visit Required</SelectItem>
              <SelectItem value="site_visit_assigned">Site Visit Assigned</SelectItem>
              <SelectItem value="site_visit_completed">Site Visit Completed</SelectItem>
              <SelectItem value="quotation_prepared">Quotation Prepared</SelectItem>
              <SelectItem value="quote_sent">Quote Sent</SelectItem>
              <SelectItem value="customer_approved">Customer Approved</SelectItem>
              <SelectItem value="payment_received">Payment Received</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {leads?.length === 0 ? "No leads yet. Add your first lead!" : "No leads match your search."}
            </p>
            {leads?.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Lead
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="cursor-pointer">
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{lead.customer_name}</p>
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
                        {lead.email && (
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm capitalize">{lead.project_type}</span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(lead.status)}`}>
                        {formatStatus(lead.status)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-muted-foreground">{lead.lead_source || '-'}</span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {lead.created_at ? formatDate(lead.created_at) : '-'}
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
        )}
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type *</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value: "epc" | "service" | "oam") => setFormData({ ...formData, project_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epc">EPC</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="oam">O&M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source</Label>
              <Select
                value={formData.lead_source}
                onValueChange={(value) => setFormData({ ...formData, lead_source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the lead..."
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Lead"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Leads;