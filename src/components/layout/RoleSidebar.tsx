import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  ClipboardList,
  Calendar,
  DollarSign,
  FileCheck,
  Settings,
  Sun,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Wallet,
  Package,
  BarChart3,
  Headphones,
  FileBarChart,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Admin sidebar items
const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: Calendar, label: "Site Visits", path: "/site-visits" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: Clock, label: "Time Logs", path: "/time-logs" },
  { icon: DollarSign, label: "Expenses", path: "/expenses" },
  { icon: Wallet, label: "Payments", path: "/payments" },
  { icon: FileBarChart, label: "Payroll", path: "/payroll" },
  { icon: FileText, label: "Quotations", path: "/quotations" },
  { icon: FileCheck, label: "Documents", path: "/documents" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Shield, label: "Admin", path: "/admin" },
];

// Project Manager sidebar items
const pmNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderKanban, label: "My Projects", path: "/projects" },
  { icon: Calendar, label: "Site Visits", path: "/site-visits" },
  { icon: ClipboardList, label: "Task Allocation", path: "/tasks" },
  { icon: Package, label: "Material Requests", path: "/projects" },
  { icon: FileBarChart, label: "Daily Reports", path: "/projects" },
  { icon: DollarSign, label: "Expenses", path: "/expenses" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

// Employee sidebar items
const employeeNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee-dashboard" },
  { icon: FolderKanban, label: "My Projects", path: "/projects" },
  { icon: ClipboardList, label: "My Tasks", path: "/tasks" },
  { icon: Clock, label: "Time In / Out", path: "/time-logs" },
  { icon: DollarSign, label: "My Expenses", path: "/expenses" },
  { icon: Wallet, label: "My Payroll", path: "/payroll" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

// Customer sidebar items
const customerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/customer-dashboard" },
  { icon: FolderKanban, label: "My Project", path: "/customer/project" },
  { icon: Wallet, label: "Payments", path: "/customer/payments" },
  { icon: FileCheck, label: "Warranty", path: "/customer/warranty" },
  { icon: FileText, label: "Documents", path: "/customer/documents" },
  { icon: Headphones, label: "Support", path: "/customer/support" },
];

interface RoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSidebar({ isOpen, onClose }: RoleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin, isCustomer, roles } = useAuth();

  // Determine which nav items to show based on role
  const getNavItems = () => {
    if (isCustomer()) return customerNavItems;
    if (isAdmin()) return adminNavItems;
    if (roles.includes("project_manager")) return pmNavItems;
    return employeeNavItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50",
          collapsed ? "w-16" : "w-64",
          // Mobile: slide in/out
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shrink-0">
              <Sun className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground">4M Solar</span>
                <span className="text-xs text-sidebar-foreground/60">Management</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path + item.label}>
                    <Link
                      to={item.path}
                      onClick={() => {
                        // Close mobile sidebar on navigation
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={cn(
                        "nav-item",
                        isActive && "nav-item-active"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Collapse Button - Desktop only */}
          <div className="border-t border-sidebar-border p-3 hidden md:block">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="nav-item w-full justify-center"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
