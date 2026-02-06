import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import WaitingForProject from "./pages/WaitingForProject";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import SiteVisits from "./pages/SiteVisits";
import TimeLogs from "./pages/TimeLogs";
import Payroll from "./pages/Payroll";
import Expenses from "./pages/Expenses";
import Quotations from "./pages/Quotations";
import QuotationPreview from "./pages/QuotationPreview";
import Payments from "./pages/Payments";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { useCustomerProjects } from "./hooks/useCustomerProjects";

const queryClient = new QueryClient();

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Customer Route - redirects customers to their dashboard or waiting page
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isCustomer } = useAuth();
  const { hasProjects, isLoading: projectsLoading } = useCustomerProjects();

  if (loading || (isCustomer() && projectsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If customer has no projects, show waiting page
  if (isCustomer() && !hasProjects) {
    return <Navigate to="/waiting-for-project" replace />;
  }

  return <>{children}</>;
}

// Staff Route - prevents customers from accessing staff pages
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isCustomer } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Customers should go to their dashboard
  if (isCustomer()) {
    return <Navigate to="/customer-dashboard" replace />;
  }

  return <>{children}</>;
}

// Public Route component (redirect if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isCustomer, isAdmin } = useAuth();
  const { hasProjects, isLoading: projectsLoading } = useCustomerProjects();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // Redirect customers appropriately
    if (isCustomer()) {
      if (projectsLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }
      return <Navigate to={hasProjects ? "/customer-dashboard" : "/waiting-for-project"} replace />;
    }
    // Staff/Admin go to main dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    
    {/* Customer Routes */}
    <Route path="/customer-dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
    <Route path="/waiting-for-project" element={<ProtectedRoute><WaitingForProject /></ProtectedRoute>} />
    
    {/* Staff/Admin Routes */}
    <Route path="/" element={<StaffRoute><Index /></StaffRoute>} />
    <Route path="/employee-dashboard" element={<StaffRoute><EmployeeDashboard /></StaffRoute>} />
    <Route path="/leads" element={<StaffRoute><Leads /></StaffRoute>} />
    <Route path="/projects" element={<StaffRoute><Projects /></StaffRoute>} />
    <Route path="/tasks" element={<StaffRoute><Tasks /></StaffRoute>} />
    <Route path="/site-visits" element={<StaffRoute><SiteVisits /></StaffRoute>} />
    <Route path="/time-logs" element={<StaffRoute><TimeLogs /></StaffRoute>} />
    <Route path="/expenses" element={<StaffRoute><Expenses /></StaffRoute>} />
    <Route path="/payroll" element={<StaffRoute><Payroll /></StaffRoute>} />
    <Route path="/quotations" element={<StaffRoute><Quotations /></StaffRoute>} />
    <Route path="/quotations/:id" element={<StaffRoute><QuotationPreview /></StaffRoute>} />
    <Route path="/payments" element={<StaffRoute><Payments /></StaffRoute>} />
    <Route path="/documents" element={<StaffRoute><Documents /></StaffRoute>} />
    <Route path="/settings" element={<StaffRoute><Settings /></StaffRoute>} />
    <Route path="/admin" element={<StaffRoute><Admin /></StaffRoute>} />
    
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
