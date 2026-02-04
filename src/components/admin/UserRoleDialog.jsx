import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAssignRole, useRemoveRole } from "@/hooks/useUsers";
import { Loader2, Shield, User, Briefcase, Wrench, Package } from "lucide-react";

const ALL_ROLES = [
  { role: "admin", label: "Admin", description: "Full system access", icon: <Shield className="h-4 w-4" /> },
  { role: "accounts", label: "Accounts", description: "Financial management", icon: <Briefcase className="h-4 w-4" /> },
  { role: "hr", label: "HR", description: "Human resources", icon: <User className="h-4 w-4" /> },
  { role: "project_manager", label: "Project Manager", description: "Manage projects and teams", icon: <Briefcase className="h-4 w-4" /> },
  { role: "senior_engineer", label: "Senior Engineer", description: "Lead technical work", icon: <Wrench className="h-4 w-4" /> },
  { role: "site_supervisor", label: "Site Supervisor", description: "Oversee installations", icon: <Wrench className="h-4 w-4" /> },
  { role: "solar_engineer", label: "Solar Engineer", description: "Design and install systems", icon: <Wrench className="h-4 w-4" /> },
  { role: "junior_technician", label: "Junior Technician", description: "Assist with installations", icon: <Wrench className="h-4 w-4" /> },
  { role: "storekeeper", label: "Storekeeper", description: "Manage inventory", icon: <Package className="h-4 w-4" /> },
];

export function UserRoleDialog({ user, open, onOpenChange }) {
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  if (!user) return null;

  const currentRoles = new Set(user.roles);
  const isLoading = assignRole.isPending || removeRole.isPending;

  const handleRoleToggle = (role, checked) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const hasRole = currentRoles.has(role);
      
      if (checked === hasRole) {
        newMap.delete(role);
      } else {
        newMap.set(role, checked);
      }
      return newMap;
    });
  };

  const handleSave = async () => {
    for (const [role, shouldHave] of pendingChanges) {
      const hasRole = currentRoles.has(role);
      if (shouldHave && !hasRole) {
        await assignRole.mutateAsync({ userId: user.id, role });
      } else if (!shouldHave && hasRole) {
        await removeRole.mutateAsync({ userId: user.id, role });
      }
    }
    setPendingChanges(new Map());
    onOpenChange(false);
  };

  const getRoleCheckedState = (role) => {
    if (pendingChanges.has(role)) {
      return pendingChanges.get(role);
    }
    return currentRoles.has(role);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            Assign or remove roles for{" "}
            <span className="font-medium text-foreground">
              {user.first_name || user.email || "User"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {ALL_ROLES.find((r) => r.role === role)?.label || role}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No roles assigned</span>
            )}
          </div>

          <div className="grid gap-3">
            {ALL_ROLES.map(({ role, label, description, icon }) => (
              <div
                key={role}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={role}
                  checked={getRoleCheckedState(role)}
                  onCheckedChange={(checked) => handleRoleToggle(role, checked)}
                  disabled={isLoading}
                />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={role}
                    className="flex items-center gap-2 cursor-pointer font-medium"
                  >
                    {icon}
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || pendingChanges.size === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
