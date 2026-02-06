import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCustomerProjects } from "@/hooks/useCustomerProjects";
import { useAuth } from "@/hooks/useAuth";
import { 
  Phone, 
  Mail, 
  MessageCircle,
  Clock,
  MapPin,
  Send,
  Headphones,
  HelpCircle
} from "lucide-react";

export default function CustomerSupport() {
  const { projects } = useCustomerProjects();
  const { profile } = useAuth();

  const project = projects?.[0];

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

  const faqs = [
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

        {/* Quick Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send a Message
            </CardTitle>
            <CardDescription>
              Describe your issue and we'll get back to you soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    defaultValue={profile?.first_name || ''} 
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project ID</label>
                  <Input 
                    defaultValue={project?.id.slice(0, 8).toUpperCase() || ''} 
                    placeholder="Project ID"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Brief description of your issue" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="Describe your issue in detail..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full md:w-auto">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
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
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <h4 className="font-medium mb-2">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
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
