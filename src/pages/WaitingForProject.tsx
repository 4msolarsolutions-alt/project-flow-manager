import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Clock, Phone, Mail, Loader2 } from "lucide-react";

export default function WaitingForProject() {
  const { profile } = useAuth();

  return (
    <AppLayout title="Welcome">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sun className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Welcome, {profile?.first_name || 'Customer'}!</CardTitle>
              <CardDescription className="mt-1">4M Solar Solutions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Processing...</span>
            </div>
            
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Your project is under processing</h3>
              <p className="text-xs text-muted-foreground">
                You will get dashboard access once your project is initiated. 
                Our team is working on your solar installation project.
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground pt-2 border-t">
              <p className="font-medium">Need assistance?</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
