import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Sun, Clock, LogOut } from "lucide-react";

export default function WaitingForProject() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sun className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome, {profile?.first_name || 'Customer'}!</CardTitle>
            <CardDescription className="mt-2">4M Solar Solutions</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse text-primary" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-6 space-y-3">
            <h3 className="font-semibold text-foreground">Your project is under processing</h3>
            <p className="text-sm text-muted-foreground">
              You will get dashboard access once your project is initiated. 
              Our team is working on your solar installation project.
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Need assistance? Contact us:</p>
            <div className="space-y-1">
              <p className="font-medium text-foreground">📞 +91 98765 43210</p>
              <p className="font-medium text-foreground">✉️ support@4msolarsolutions.com</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
