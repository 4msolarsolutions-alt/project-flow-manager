import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useExpenses } from "@/hooks/useExpenses";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Camera, DollarSign, Loader2, Plus, Receipt, Upload, Eye, Check, X, AlertCircle, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExpenseVerificationDialog } from "@/components/expenses/ExpenseVerificationDialog";

const EXPENSE_TYPES = [
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel / Petrol" },
  { value: "material", label: "Material" },
  { value: "other", label: "Other" },
];

export default function Expenses() {
  const { expenses, totals, isLoading, createExpense } = useExpenses();
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [workType, setWorkType] = useState<string>("project");
  const [expenseType, setExpenseType] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // For food expense calculation
  const [persons, setPersons] = useState("1");
  const [days, setDays] = useState("1");
  const ratePerDay = 200;

  // For admin verification
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  const canApprove = isAdmin();

  const resetForm = () => {
    setWorkType("project");
    setExpenseType("");
    setSelectedProject("");
    setSelectedLead("");
    setAmount("");
    setDescription("");
    setBillFile(null);
    setPersons("1");
    setDays("1");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setBillFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!expenseType) {
      toast({ title: "Error", description: "Please select expense type", variant: "destructive" });
      return;
    }
    if (workType === "project" && !selectedProject) {
      toast({ title: "Error", description: "Please select a project", variant: "destructive" });
      return;
    }
    if (workType === "lead" && !selectedLead) {
      toast({ title: "Error", description: "Please select a lead", variant: "destructive" });
      return;
    }
    if (!billFile) {
      toast({ title: "Error", description: "Bill image is mandatory", variant: "destructive" });
      return;
    }

    const expenseAmount = expenseType === "food" 
      ? parseInt(persons) * parseInt(days) * ratePerDay 
      : parseFloat(amount);

    if (!expenseAmount || expenseAmount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      // Upload bill image to storage
      const fileExt = billFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('expense-bills')
        .upload(fileName, billFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('expense-bills')
        .getPublicUrl(fileName);

      // Create expense record with work_type logic
      // Lead = Company expense, Project = Project expense
      const expenseScope = workType === "lead" ? "company" : "project";
      
      await createExpense.mutateAsync({
        expense_type: expenseType as "food" | "travel" | "material" | "other",
        project_id: workType === "project" ? selectedProject : null,
        lead_id: workType === "lead" ? selectedLead : null,
        work_type: workType,
        amount: expenseAmount,
        description,
        submitted_by: user?.id,
        persons: expenseType === "food" ? parseInt(persons) : null,
        days: expenseType === "food" ? parseInt(days) : null,
        rate_per_day: expenseType === "food" ? ratePerDay : null,
        bill_image_url: fileName,
        expense_scope: expenseScope as "project" | "company",
      });

      setIsAddOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit expense",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "₹0";
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter expenses for current user if not admin
  const displayExpenses = canApprove 
    ? expenses 
    : expenses?.filter(e => e.submitted_by === user?.id);

  return (
    <AppLayout title={canApprove ? "All Expenses" : "My Expenses"}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submitted</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
              <p className="text-xs text-muted-foreground">All expenses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Food Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.food)}</div>
              <p className="text-xs text-muted-foreground">₹200/person/day</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Travel Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.travel)}</div>
              <p className="text-xs text-muted-foreground">Petrol, transport</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Material</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.material)}</div>
              <p className="text-xs text-muted-foreground">Project materials</p>
            </CardContent>
          </Card>
        </div>

        {/* Expense List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{canApprove ? "All Expenses" : "My Expenses"}</CardTitle>
              <CardDescription>
                {canApprove 
                  ? "Review and approve employee expense claims" 
                  : "Submit and track your expense claims"}
              </CardDescription>
            </div>
            {!canApprove && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Expense</DialogTitle>
                    <DialogDescription>
                      Upload your bill and enter expense details. Bill image is mandatory.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Expense Type *</Label>
                      <Select value={expenseType} onValueChange={setExpenseType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Work Type *</Label>
                      <Select value={workType} onValueChange={(value) => {
                        setWorkType(value);
                        setSelectedProject("");
                        setSelectedLead("");
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead Site Visit</SelectItem>
                          <SelectItem value="project">Project Work</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {workType === "lead" ? "Company expense (pre-project)" : "Project expense"}
                      </p>
                    </div>

                    {workType === "lead" && (
                      <div>
                        <Label>Lead *</Label>
                        <Select value={selectedLead} onValueChange={setSelectedLead}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead" />
                          </SelectTrigger>
                          <SelectContent>
                            {leads?.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id}>
                                {lead.customer_name} - {lead.address}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {workType === "project" && (
                      <div>
                        <Label>Project *</Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.project_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {expenseType === "food" ? (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Food Expense Calculator</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>No. of Persons</Label>
                            <Input
                              type="number"
                              min="1"
                              value={persons}
                              onChange={(e) => setPersons(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>No. of Days</Label>
                            <Input
                              type="number"
                              min="1"
                              value={days}
                              onChange={(e) => setDays(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Rate: ₹{ratePerDay}/person/day</span>
                          <span className="font-bold">
                            Total: ₹{parseInt(persons || "1") * parseInt(days || "1") * ratePerDay}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label>Amount (₹) *</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Brief description of expense"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        Bill Image * 
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </Label>
                      <div className="mt-2">
                        {billFile ? (
                          <div className="flex items-center gap-2 p-3 bg-accent border border-border rounded-lg">
                            <Check className="h-5 w-5 text-primary" />
                            <span className="text-sm flex-1 truncate">{billFile.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setBillFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isUploading || createExpense.isPending}
                    >
                      {(isUploading || createExpense.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Submit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayExpenses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expenses found.</p>
                {!canApprove && (
                  <p className="text-sm mt-2">Click "Add Expense" to submit your first claim.</p>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Lead / Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Bill</TableHead>
                      <TableHead>Status</TableHead>
                      {canApprove && <TableHead>Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayExpenses?.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {expense.expense_date 
                            ? format(new Date(expense.expense_date), 'dd MMM yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="capitalize">{expense.expense_type}</TableCell>
                        <TableCell>
                          {expense.work_type === 'lead' 
                            ? <span className="text-muted-foreground">{expense.leads?.customer_name || 'Lead'}</span>
                            : expense.projects?.project_name || <span className="text-muted-foreground">Company</span>}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {expense.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          {expense.bill_image_url ? (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status || 'pending')}</TableCell>
                        {canApprove && (
                          <TableCell>
                            {expense.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setIsVerifyOpen(true);
                                }}
                              >
                                <ClipboardCheck className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Dialog for Admin */}
      <ExpenseVerificationDialog
        expense={selectedExpense}
        open={isVerifyOpen}
        onOpenChange={setIsVerifyOpen}
      />
    </AppLayout>
  );
}
