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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Navigation items with role-based visibility
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", adminOnly: true },
  { icon: LayoutDashboard, label: "My Dashboard", path: "/employee-dashboard", employeeOnly: true },
  { icon: Users, label: "Leads", path: "/leads", adminOnly: true },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: Calendar, label: "Site Visits", path: "/site-visits" },
  { icon: FileText, label: "Quotations", path: "/quotations", adminOnly: true },
  { icon: DollarSign, label: "Payments", path: "/payments", adminOnly: true },
  { icon: FileCheck, label: "Documents", path: "/documents", adminOnly: true },
  { icon: Settings, label: "Settings", path: "/settings", adminOnly: true },
  { icon: Shield, label: "Admin", path: "/admin", adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();

  const visibleNavItems = navItems.filter((item) => {
    if (item.adminOnly) return isAdmin();
    if (item.employeeOnly) return !isAdmin();
    return true;
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Sun className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">SolarEPC</span>
              <span className="text-xs text-sidebar-foreground/60">Management</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-item ${isActive ? "nav-item-active" : ""}`}
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

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-3">
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
  );
}
