import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { useCreateEmployee } from "@/hooks/useUsers";

type AppRole = Database["public"]["Enums"]["app_role"];

const roleOptions: { role: AppRole; label: string }[] = [
  { role: "admin", label: "Admin" },
  { role: "accounts", label: "Accounts" },
  { role: "hr", label: "HR" },
  { role: "project_manager", label: "Project Manager" },
  { role: "senior_engineer", label: "Senior Engineer" },
  { role: "site_supervisor", label: "Site Supervisor" },
  { role: "solar_engineer", label: "Solar Engineer" },
  { role: "junior_technician", label: "Junior Technician" },
  { role: "storekeeper", label: "Storekeeper" },
];

const employeeSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60),
  last_name: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[+0-9][0-9\s-]{6,}$/.test(v),
      "Enter a valid phone (digits, +, spaces, -)"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const createEmployee = useCreateEmployee();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<AppRole>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = createEmployee.isPending;

  const selectedRoleLabels = useMemo(
    () => Array.from(selectedRoles).map((r) => roleOptions.find((o) => o.role === r)?.label || r),
    [selectedRoles]
  );

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSelectedRoles(new Set());
    setErrors({});
  };

  const validate = () => {
    const parsed = employeeSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password,
    });

    if (parsed.success) {
      setErrors({});
      return parsed.data;
    }

    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] || "form");
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = validate();
    if (!data) return;

    await createEmployee.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name?.trim() || null,
      email: data.email,
      phone: data.phone?.trim() || null,
      password: data.password,
      roles: Array.from(selectedRoles),
    });

    reset();
    onOpenChange(false);
  };

  const toggleRole = (role: AppRole, checked: boolean) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (checked) next.add(role);
      else next.delete(role);
      return next;
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Employee
          </DialogTitle>
          <DialogDescription>
            Creates an employee login. They can log in immediately with the password you set.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emp-first">First name</Label>
              <Input
                id="emp-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-last">Last name</Label>
              <Input
                id="emp-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-password">Password</Label>
            <Input
              id="emp-password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-phone">WhatsApp phone (optional)</Label>
            <Input
              id="emp-phone"
              placeholder="+91 9XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Roles (optional)</Label>
              <div className="flex flex-wrap gap-1 justify-end">
                {selectedRoleLabels.length ? (
                  selectedRoleLabels.slice(0, 3).map((lbl) => (
                    <Badge key={lbl} variant="secondary" className="text-xs">
                      {lbl}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No roles selected</span>
                )}
              </div>
            </div>

            <div className="grid gap-2 rounded-lg border border-border p-3">
              {roleOptions.map((opt) => (
                <div key={opt.role} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${opt.role}`}
                    checked={selectedRoles.has(opt.role)}
                    onCheckedChange={(v) => toggleRole(opt.role, Boolean(v))}
                    disabled={isLoading}
                  />
                  <Label htmlFor={`role-${opt.role}`} className="cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}