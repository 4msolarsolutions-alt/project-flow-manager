import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  onMenuClick: () => void;
  title?: string;
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const { signOut, profile, roles, isAdmin, isCustomer } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleBadge = () => {
    if (isAdmin()) return { label: "Admin", variant: "default" as const };
    if (isCustomer()) return { label: "Customer", variant: "secondary" as const };
    if (roles.includes("project_manager")) return { label: "Project Manager", variant: "outline" as const };
    if (roles.length > 0) return { label: roles[0].replace(/_/g, " "), variant: "outline" as const };
    return { label: profile?.login_type || "User", variant: "secondary" as const };
  };

  const roleBadge = getRoleBadge();
  const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img
            src="/images/4m-solar-logo.png"
            alt="4M Solar"
            className="h-8 w-8 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="font-semibold text-foreground hidden sm:inline">
            {title || "4M Solar"}
          </span>
        </div>
      </div>

      {/* Right: Role Badge + Notifications + Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        <Badge variant={roleBadge.variant} className="hidden sm:inline-flex capitalize">
          {roleBadge.label}
        </Badge>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Notification indicator */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {profile?.first_name} {profile?.last_name}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{profile?.first_name} {profile?.last_name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {profile?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
