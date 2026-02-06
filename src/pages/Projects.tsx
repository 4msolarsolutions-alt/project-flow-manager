import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Calendar, User, Zap, Loader2, Eye, Edit2, FileText, ClipboardList } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useUsers } from "@/hooks/useUsers";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type ProjectType = Database["public"]["Enums"]["project_type"];

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusClass = (status: string | null) => {
  switch (status) {
    case "planning":
      return "status-new";
    case "in_progress":
      return "status-in-progress";
    case "completed":
      return "status-completed";
    case "on_hold":
      return "status-cancelled";
    default:
      return "status-new";
  }
};

const formatStatus = (status: string | null) => {
  if (!status) return "Planning";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Projects = () => {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, updateProject } = useProjects();
  const { leads } = useLeads();
  const { data: users } = useUsers();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    project_name: "",
    project_type: "epc" as ProjectType,
    lead_id: "",
    pm_id: "",
    capacity_kw: "",
    total_amount: "",
    start_date: "",
    expected_end_date: "",
    status: "planning",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      project_name: "",
      project_type: "epc",
      lead_id: "",
      pm_id: "",
      capacity_kw: "",
      total_amount: "",
      start_date: "",
      expected_end_date: "",
      status: "planning",
      notes: "",
    });
  };

  const handleOpenView = (project: any) => {
    setSelectedProject(project);
    setIsViewDialogOpen(true);
  };

  const handleOpenEdit = (project: any) => {
    setSelectedProject(project);
    setFormData({
      project_name: project.project_name || "",
      project_type: project.project_type || "epc",
      lead_id: project.lead_id || "",
      pm_id: project.pm_id || "",
      capacity_kw: project.capacity_kw?.toString() || "",
      total_amount: project.total_amount?.toString() || "",
      start_date: project.start_date || "",
      expected_end_date: project.expected_end_date || "",
      status: project.status || "planning",
      notes: project.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name) return;

    setIsSubmitting(true);
    try {
      await createProject.mutateAsync({
        project_name: formData.project_name,
        project_type: formData.project_type,
        lead_id: formData.lead_id || null,
        pm_id: formData.pm_id || null,
        capacity_kw: formData.capacity_kw ? parseFloat(formData.capacity_kw) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        start_date: formData.start_date || null,
        expected_end_date: formData.expected_end_date || null,
        status: formData.status,
        notes: formData.notes || null,
      });
      setIsAddDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.project_name) return;

    setIsSubmitting(true);
    try {
      await updateProject.mutateAsync({
        id: selectedProject.id,
        project_name: formData.project_name,
        project_type: formData.project_type,
        lead_id: formData.lead_id || null,
        pm_id: formData.pm_id || null,
        capacity_kw: formData.capacity_kw ? parseFloat(formData.capacity_kw) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        start_date: formData.start_date || null,
        expected_end_date: formData.expected_end_date || null,
        status: formData.status,
        notes: formData.notes || null,
      });
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get PM name helper
  const getPmName = (pmId: string | null) => {
    if (!pmId || !users) return "Unassigned";
    const pm = users.find((u) => u.id === pmId);
    return pm ? `${pm.first_name || ""} ${pm.last_name || ""}`.trim() || pm.email : "Unassigned";
  };

  // Calculate mock progress based on status
  const getProgress = (status: string | null) => {
    switch (status) {
      case "planning":
        return 10;
      case "in_progress":
        return 50;
      case "completed":
        return 100;
      case "on_hold":
        return 30;
      default:
        return 0;
    }
  };

  return (
    <AppLayout title="Projects">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          {projects?.length || 0} projects total
        </p>
        <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !projects?.length ? (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl bg-card border border-border p-6 transition-all duration-200 hover:shadow-md animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{project.project_name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(project as any).leads?.customer_name || "No customer"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleOpenView(project)}
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => handleOpenEdit(project)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => navigate(`/tasks?project=${project.id}`)}
                    >
                      <ClipboardList className="h-4 w-4" />
                      View Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => navigate(`/documents?project=${project.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      Documents
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <span className={`status-badge ${getStatusClass(project.status)}`}>
                  {formatStatus(project.status)}
                </span>
                <span className="text-sm text-muted-foreground capitalize">
                  {project.project_type}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span>{project.capacity_kw || 0} kW</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="truncate">{getPmName(project.pm_id)}</span>
                </div>
              </div>

              {project.total_amount && (
                <div className="mt-2 text-sm font-semibold text-primary">
                  {formatCurrency(project.total_amount)}
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{getProgress(project.status)}%</span>
                </div>
                <Progress value={getProgress(project.status)} className="mt-2 h-2" />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.start_date)}</span>
                </div>
                <span>→</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.expected_end_date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_type: value as ProjectType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epc">EPC</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="oam">O&M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead/Customer</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads?.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project Manager</Label>
                <Select
                  value={formData.pm_id}
                  onValueChange={(value) => setFormData({ ...formData, pm_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name || user.email} {user.last_name || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity_kw">Capacity (kW)</Label>
                <Input
                  id="capacity_kw"
                  type="number"
                  value={formData.capacity_kw}
                  onChange={(e) => setFormData({ ...formData, capacity_kw: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount (₹)</Label>
                <Input
                  id="total_amount"
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_end_date">Expected End Date</Label>
                <Input
                  id="expected_end_date"
                  type="date"
                  value={formData.expected_end_date}
                  onChange={(e) => setFormData({ ...formData, expected_end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Project notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Project Name</Label>
                  <p className="font-medium">{selectedProject.project_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">{selectedProject.project_type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">
                    {selectedProject.leads?.customer_name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <span className={`status-badge ${getStatusClass(selectedProject.status)}`}>
                    {formatStatus(selectedProject.status)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Capacity</Label>
                  <p className="font-medium">{selectedProject.capacity_kw || 0} kW</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedProject.total_amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Start Date</Label>
                  <p className="font-medium">{formatDate(selectedProject.start_date)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expected End</Label>
                  <p className="font-medium">{formatDate(selectedProject.expected_end_date)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Project Manager</Label>
                <p className="font-medium">{getPmName(selectedProject.pm_id)}</p>
              </div>
              {selectedProject.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="font-medium">{selectedProject.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                handleOpenEdit(selectedProject);
              }}
            >
              Edit Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_project_name">Project Name *</Label>
              <Input
                id="edit_project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_type: value as ProjectType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epc">EPC</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="oam">O&M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lead/Customer</Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads?.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project Manager</Label>
                <Select
                  value={formData.pm_id}
                  onValueChange={(value) => setFormData({ ...formData, pm_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PM" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name || user.email} {user.last_name || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_capacity_kw">Capacity (kW)</Label>
                <Input
                  id="edit_capacity_kw"
                  type="number"
                  value={formData.capacity_kw}
                  onChange={(e) => setFormData({ ...formData, capacity_kw: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_total_amount">Total Amount (₹)</Label>
                <Input
                  id="edit_total_amount"
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Start Date</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_expected_end_date">Expected End Date</Label>
                <Input
                  id="edit_expected_end_date"
                  type="date"
                  value={formData.expected_end_date}
                  onChange={(e) => setFormData({ ...formData, expected_end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Projects;
