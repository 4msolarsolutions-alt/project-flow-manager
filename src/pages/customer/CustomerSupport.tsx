import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { 
  Phone, 
  Mail, 
  MessageCircle,
  Clock,
  MapPin,
  Send,
  Headphones,
  HelpCircle,
  Plus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const ISSUE_TYPES = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing Query' },
  { value: 'maintenance', label: 'Maintenance Request' },
  { value: 'warranty', label: 'Warranty Claim' },
  { value: 'general', label: 'General Inquiry' },
];

const FAQ_ITEMS = [
  {
    question: "How do I monitor my solar system's performance?",
    answer: "You can track your system's performance through the inverter's mobile app or web portal. Contact us for setup assistance."
  },
  {
    question: "What should I do if my system stops working?",
    answer: "First, check if there's a power outage. If not, check the inverter display for error codes and contact our support team immediately."
  },
  {
    question: "How often should I clean my solar panels?",
    answer: "We recommend cleaning panels every 2-3 months, or more frequently in dusty areas. Use plain water and a soft cloth."
  },
  {
    question: "Is my system covered under warranty?",
    answer: "Yes! Your panels have a 25-year performance warranty and 12-year product warranty. The inverter has a 5-year warranty."
  },
  {
    question: "How do I claim warranty for defective components?",
    answer: "Contact our support team with your project ID and issue details. We'll guide you through the warranty claim process."
  }
];

export default function CustomerSupport() {
  const { projects, isLoading: projectsLoading } = useCustomerProjects();
  const { profile } = useAuth();
  const project = projects?.[0];
  
  const { tickets, isLoading: ticketsLoading, createTicket, openTickets, resolvedTickets } = useSupportTickets(project?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    issue_type: '',
    subject: '',
    message: '',
  });

  const isLoading = projectsLoading || ticketsLoading;

  const supportChannels = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our support team",
      action: "tel:+919876543210",
      actionLabel: "+91 98765 43210",
      available: "Mon-Sat, 9 AM - 6 PM"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Quick responses on WhatsApp",
      action: "https://wa.me/919876543210",
      actionLabel: "Chat on WhatsApp",
      available: "24/7 support"
    },
    {
      icon: Mail,
      title: "Email",
      description: "Send us detailed queries",
      action: "mailto:support@4msolarsolutions.com",
      actionLabel: "support@4msolarsolutions.com",
      available: "Response within 24 hours"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project?.id) {
      toast.error('No project found');
      return;
    }

    if (!formData.issue_type || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    await createTicket.mutateAsync({
      project_id: project.id,
      issue_type: formData.issue_type,
      subject: formData.subject,
      message: formData.message,
    });

    setFormData({ issue_type: '', subject: '', message: '' });
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <AppLayout title="Support">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Support">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p className="text-lg font-medium">Your project is not yet activated</p>
            <p className="text-sm mt-2">Please contact support for assistance.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Support">
      <div className="space-y-6">
        {/* Support Banner */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary-foreground/10">
                <Headphones className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">We're Here to Help</h2>
                <p className="text-primary-foreground/80">
                  Get support for your solar installation from our expert team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Channels */}
        <div className="grid gap-4 md:grid-cols-3">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card key={channel.title}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{channel.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(channel.action, '_blank')}
                    >
                      {channel.actionLabel}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {channel.available}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Support Tickets Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Support Tickets
              </CardTitle>
              <CardDescription>
                {openTickets} open, {resolvedTickets} resolved
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription>
                    Describe your issue and our team will respond promptly.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_type">Issue Type</Label>
                    <Select 
                      value={formData.issue_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, issue_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ISSUE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Provide details about your issue..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTicket.isPending}>
                    {createTicket.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {tickets && tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ISSUE_TYPES.find(t => t.value === ticket.issue_type)?.label || ticket.issue_type}
                        </p>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {ticket.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Created: {formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No support tickets yet</p>
                <p className="text-sm">Create a ticket if you need assistance.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Office Location */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-semibold">Visit Our Office</h3>
                <p className="text-sm text-muted-foreground">
                  4M Solar Solutions<br />
                  123 Solar Street, Green Energy Park<br />
                  Chennai, Tamil Nadu 600001
                </p>
                <Button variant="link" className="px-0 mt-2">
                  Get Directions →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
