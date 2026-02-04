import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, MapPin, User, Building, CheckCircle2, Clock, Plus, Loader2 } from "lucide-react";
import { useSiteVisits } from "@/hooks/useSiteVisits";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { SiteVisitForm } from "@/components/site-visits/SiteVisitForm";

const SiteVisits = () => {
  const { siteVisits, isLoading, createSiteVisit } = useSiteVisits();
  const { leads } = useLeads();
  const { user } = useAuth();
  
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Schedule form state
  const [scheduleData, setScheduleData] = useState({
    lead_id: "",
    scheduled_date: "",
    scheduled_time: "",
  });

  // Filter leads that need site visits
  const leadsNeedingVisit = leads?.filter(
    (lead) => lead.status === 'new_call' || lead.status === 'site_visit_required'
  ) || [];

  const scheduled = siteVisits?.filter((v) => v.status === "scheduled") || [];
  const completed = siteVisits?.filter((v) => v.status === "completed") || [];

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await createSiteVisit.mutateAsync({
      lead_id: scheduleData.lead_id,
      scheduled_date: scheduleData.scheduled_date,
      scheduled_time: scheduleData.scheduled_time,
      engineer_id: user?.id,
      status: 'scheduled',
    });
    
    setIsSubmitting(false);
    setIsScheduleDialogOpen(false);
    setScheduleData({ lead_id: "", scheduled_date: "", scheduled_time: "" });
  };

  const handleStartVisit = (visit: any) => {
    setSelectedVisit(visit);
    setIsFormOpen(true);
  };

  const handleFormComplete = () => {
    setSelectedVisit(null);
    setIsFormOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Layout title="Site Visits">
      {/* Scheduled Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Scheduled Visits</h2>
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Visit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Site Visit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleScheduleVisit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Lead *</Label>
                  <Select
                    value={scheduleData.lead_id}
                    onValueChange={(value) => setScheduleData({ ...scheduleData, lead_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadsNeedingVisit.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No leads available for site visit
                        </div>
                      ) : (
                        leadsNeedingVisit.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.customer_name} - {lead.address.substring(0, 30)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={scheduleData.scheduled_date}
                      onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={scheduleData.scheduled_time}
                      onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !scheduleData.lead_id}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Visit"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : scheduled.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No Scheduled Visits</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule a site visit for leads that require assessment.
            </p>
            <Button onClick={() => setIsScheduleDialogOpen(true)}>
              Schedule First Visit
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scheduled.map((visit: any) => (
              <div
                key={visit.id}
                className="rounded-xl bg-card border border-border p-6 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {visit.leads?.customer_name || 'Unknown Lead'}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {visit.leads?.address || 'No address'}
                    </p>
                  </div>
                  <span className="status-badge bg-warning/20 text-warning">
                    <Clock className="mr-1 h-3 w-3" />
                    Scheduled
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{visit.scheduled_date ? formatDate(visit.scheduled_date) : 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{visit.scheduled_time || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Assigned Engineer</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{visit.building_type?.replace('_', ' ') || 'Pending'}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Reschedule
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStartVisit(visit)}
                  >
                    Start Visit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Completed Visits</h2>
        {completed.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No Completed Visits Yet</h3>
            <p className="text-sm text-muted-foreground">
              Completed site visits will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Location</th>
                  <th>Building Type</th>
                  <th>Roof Area</th>
                  <th>Recommended</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((visit: any) => (
                  <tr key={visit.id}>
                    <td className="font-medium text-foreground">
                      {visit.leads?.customer_name || 'Unknown'}
                    </td>
                    <td className="text-muted-foreground">
                      {visit.leads?.address?.substring(0, 30) || 'No address'}
                    </td>
                    <td className="capitalize">
                      {visit.building_type?.replace('_', ' ') || '-'}
                    </td>
                    <td>{visit.roof_area ? `${visit.roof_area} sq.m` : '-'}</td>
                    <td className="font-medium">
                      {visit.recommended_capacity ? `${visit.recommended_capacity} KW` : '-'}
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        {visit.completed_at ? formatDate(visit.completed_at) : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Site Visit Form Modal */}
      {selectedVisit && (
        <SiteVisitForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          leadId={selectedVisit.lead_id}
          leadName={selectedVisit.leads?.customer_name || 'Unknown'}
          leadAddress={selectedVisit.leads?.address || 'No address'}
          onComplete={handleFormComplete}
        />
      )}
    </Layout>
  );
};

export default SiteVisits;
