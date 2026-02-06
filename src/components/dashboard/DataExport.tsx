import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { 
  exportToExcel, 
  exportToCSV, 
  formatLeadsForExport, 
  formatProjectsForExport,
  formatPaymentsForExport,
  formatExpensesForExport
} from "@/utils/exportData";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ExportFormat = 'excel' | 'csv';
type DataType = 'leads' | 'projects' | 'payments' | 'expenses';

export function DataExport() {
  const [selectedData, setSelectedData] = useState<DataType>('leads');
  const [isExporting, setIsExporting] = useState(false);
  
  const { leads } = useLeads();
  const { projects } = useProjects();
  const { payments } = usePayments();
  const { expenses } = useExpenses();

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      let data: Record<string, unknown>[] = [];
      let filename = '';

      switch (selectedData) {
        case 'leads':
          if (!leads || leads.length === 0) throw new Error('No leads data available');
          data = formatLeadsForExport(leads);
          filename = `4M-Solar-Leads-${timestamp}`;
          break;
        case 'projects':
          if (!projects || projects.length === 0) throw new Error('No projects data available');
          data = formatProjectsForExport(projects);
          filename = `4M-Solar-Projects-${timestamp}`;
          break;
        case 'payments':
          if (!payments || payments.length === 0) throw new Error('No payments data available');
          data = formatPaymentsForExport(payments);
          filename = `4M-Solar-Payments-${timestamp}`;
          break;
        case 'expenses':
          if (!expenses || expenses.length === 0) throw new Error('No expenses data available');
          data = formatExpensesForExport(expenses);
          filename = `4M-Solar-Expenses-${timestamp}`;
          break;
      }

      if (format === 'excel') {
        exportToExcel(data, filename, selectedData.charAt(0).toUpperCase() + selectedData.slice(1));
      } else {
        exportToCSV(data, filename);
      }

      toast.success(`${selectedData} exported successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const getRecordCount = () => {
    switch (selectedData) {
      case 'leads': return leads?.length || 0;
      case 'projects': return projects?.length || 0;
      case 'payments': return payments?.length || 0;
      case 'expenses': return expenses?.length || 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export your data to Excel or CSV for external dashboards and reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Data Type</label>
          <Select value={selectedData} onValueChange={(v) => setSelectedData(v as DataType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leads">Leads ({leads?.length || 0} records)</SelectItem>
              <SelectItem value="projects">Projects ({projects?.length || 0} records)</SelectItem>
              <SelectItem value="payments">Payments ({payments?.length || 0} records)</SelectItem>
              <SelectItem value="expenses">Expenses ({expenses?.length || 0} records)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 flex gap-3">
          <Button 
            onClick={() => handleExport('excel')} 
            disabled={isExporting || getRecordCount() === 0}
            className="flex-1"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Export to Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('csv')} 
            disabled={isExporting || getRecordCount() === 0}
            className="flex-1"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export to CSV
          </Button>
        </div>

        {getRecordCount() === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            No {selectedData} data available to export
          </p>
        )}
      </CardContent>
    </Card>
  );
}
