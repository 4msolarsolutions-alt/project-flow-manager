import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsers, type UserWithRoles } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";
import { UserRoleDialog } from "@/components/admin/UserRoleDialog";
import { UserStatusDialog } from "@/components/admin/UserStatusDialog";
import { AddEmployeeDialog } from "@/components/admin/AddEmployeeDialog";
import {
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldX,
  Mail,
  Phone,
  Loader2,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { format } from "date-fns";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  accounts: "Accounts",
  hr: "HR",
  project_manager: "Project Manager",
  senior_engineer: "Senior Engineer",
  site_supervisor: "Site Supervisor",
  solar_engineer: "Solar Engineer",
  junior_technician: "Junior Technician",
  storekeeper: "Storekeeper",
};

const loginTypeLabels: Record<string, string> = {
  admin: "Admin",
  employee: "Employee",
  customer: "Customer",
};

const Admin = () => {
  const { isAdmin } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);

  // Check admin access
  if (!isAdmin()) {
    return (
      <Layout title="Access Denied">
        <div className="flex flex-col items-center justify-center py-20">
          <ShieldX className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </Layout>
    );
  }

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    const matchesType =
      typeFilter === "all" || user.login_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.is_active).length || 0,
    inactive: users?.filter((u) => !u.is_active).length || 0,
  };

  return (
    <Layout title="Admin Panel">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/50">
            <UserCheck className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-destructive/10">
            <UserX className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inactive Users</p>
            <p className="text-2xl font-bold">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end">
          <Button onClick={() => setAddEmployeeOpen(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-destructive">
            Error loading users: {error.message}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(user.first_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                              : "No name"}
                          </p>
                          {user.company_name && (
                            <p className="text-xs text-muted-foreground">
                              {user.company_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.email && (
                          <p className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </p>
                        )}
                        {user.phone && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {loginTypeLabels[user.login_type] || user.login_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.roles.length > 0 ? (
                          user.roles.slice(0, 2).map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {roleLabels[role] || role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                        {user.roles.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-accent/50 text-accent-foreground hover:bg-accent/70">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                          <ShieldX className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.created_at
                          ? format(new Date(user.created_at), "MMM d, yyyy")
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setStatusDialogOpen(true);
                            }}
                          >
                            {user.is_active ? (
                              <>
                                <ShieldX className="mr-2 h-4 w-4" />
                                Deactivate User
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogs */}
      <UserRoleDialog
        user={selectedUser}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />
      <UserStatusDialog
        user={selectedUser}
        open={statusDialogOpen}
        onOpenChange={statusDialogOpen ? setStatusDialogOpen : () => {}}
      />

      <AddEmployeeDialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen} />
    </Layout>
  );
};

export default Admin;
