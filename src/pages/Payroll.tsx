import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePayroll, useEmployeesForPayroll } from "@/hooks/usePayroll";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Calculator, Check, DollarSign, Loader2, MoreHorizontal, Receipt } from "lucide-react";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function Payroll() {
  const { payrollRecords, isLoading, generatePayroll, approvePayroll, markAsPaid } = usePayroll();
  const { data: employees } = useEmployeesForPayroll();
  const { isAdmin } = useAuth();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hourlyRate, setHourlyRate] = useState("");

  const canManagePayroll = isAdmin();

  const handleGenerate = async () => {
    if (!selectedEmployee || !hourlyRate) return;
    
    await generatePayroll.mutateAsync({
      user_id: selectedEmployee,
      month: selectedMonth,
      year: selectedYear,
      hourly_rate: parseFloat(hourlyRate),
    });
    
    setIsGenerateOpen(false);
    setSelectedEmployee("");
    setHourlyRate("");
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    const employee = employees?.find(e => e.id === employeeId);
    if (employee?.hourly_rate) {
      setHourlyRate(employee.hourly_rate.toString());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'generated':
        return <Badge variant="secondary">Generated</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "₹0";
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return "0h";
    return `${hours.toFixed(1)}h`;
  };

  const getMonthName = (month: number) => {
    return MONTHS.find(m => m.value === month)?.label || month.toString();
  };

  return (
    <Layout title="Payroll">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payrollRecords
                    ?.filter(p => p.status === 'generated' || p.status === 'approved')
                    .reduce((sum, p) => sum + (p.total_payable || 0), 0) || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payrollRecords
                    ?.filter(p => p.status === 'paid' && p.month === new Date().getMonth() + 1 && p.year === currentYear)
                    .reduce((sum, p) => sum + (p.total_payable || 0), 0) || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">{getMonthName(new Date().getMonth() + 1)} {currentYear}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatHours(
                  payrollRecords
                    ?.filter(p => p.month === new Date().getMonth() + 1 && p.year === currentYear)
                    .reduce((sum, p) => sum + (p.total_hours || 0), 0) || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>
                {canManagePayroll ? "Manage employee payroll" : "View your payroll history"}
              </CardDescription>
            </div>
            {canManagePayroll && (
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Generate Payroll
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Payroll</DialogTitle>
                    <DialogDescription>
                      Calculate payroll for an employee based on their time logs and expenses.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Employee</label>
                      <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Month</label>
                        <Select 
                          value={selectedMonth.toString()} 
                          onValueChange={(v) => setSelectedMonth(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Year</label>
                        <Select 
                          value={selectedYear.toString()} 
                          onValueChange={(v) => setSelectedYear(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Hourly Rate (₹)</label>
                      <Input
                        type="number"
                        placeholder="Enter hourly rate"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGenerate}
                      disabled={!selectedEmployee || !hourlyRate || generatePayroll.isPending}
                    >
                      {generatePayroll.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Generate
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
            ) : payrollRecords?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payroll records found.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      {canManagePayroll && <TableHead className="w-[50px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.profiles?.first_name} {record.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          {getMonthName(record.month)} {record.year}
                        </TableCell>
                        <TableCell className="text-right">{formatHours(record.total_hours)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.hourly_rate)}/hr</TableCell>
                        <TableCell className="text-right">{formatCurrency(record.base_salary)}</TableCell>
                        <TableCell className="text-right text-primary">
                          +{formatCurrency(record.expense_reimbursement)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          -{formatCurrency(record.deductions)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(record.total_payable)}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        {canManagePayroll && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {record.status === 'generated' && (
                                  <DropdownMenuItem 
                                    onClick={() => approvePayroll.mutate(record.id)}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {record.status === 'approved' && (
                                  <DropdownMenuItem 
                                    onClick={() => markAsPaid.mutate(record.id)}
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
    </Layout>
  );
}
