import { Link, useLocation } from "react-router-dom";
import { Home, ClipboardList, Clock, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const employeeNavItems = [
  { icon: Home, label: "Home", path: "/employee-dashboard" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: Clock, label: "Time", path: "/time-logs" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: User, label: "Profile", path: "/settings" },
];

const adminNavItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: Clock, label: "Payroll", path: "/payroll" },
  { icon: User, label: "Profile", path: "/settings" },
];

const customerNavItems = [
  { icon: Home, label: "Home", path: "/customer-dashboard" },
  { icon: ClipboardList, label: "Project", path: "/customer-dashboard" },
  { icon: Receipt, label: "Payments", path: "/customer-dashboard" },
  { icon: User, label: "Profile", path: "/settings" },
];

export function MobileNav() {
  const location = useLocation();
  const { isAdmin, isCustomer } = useAuth();

  // Select nav items based on role
  const navItems = isCustomer() 
    ? customerNavItems 
    : isAdmin() 
      ? adminNavItems 
      : employeeNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
