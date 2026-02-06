import { ReactNode, useState } from "react";
import { TopBar } from "./TopBar";
import { RoleSidebar } from "./RoleSidebar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCustomer } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <RoleSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="md:pl-64 transition-all duration-300 flex flex-col min-h-screen">
        <TopBar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={title}
        />
        
        {/* Main content with bottom padding for mobile nav */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
