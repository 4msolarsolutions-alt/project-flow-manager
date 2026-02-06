import * as XLSX from 'xlsx';

// Generic export to Excel
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = 'Data'
) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidth = 50;
  const columnWidths = Object.keys(data[0]).map(key => ({
    wch: Math.min(
      maxWidth,
      Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    )
  }));
  worksheet['!cols'] = columnWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export to CSV
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Format data for dashboard exports
export function formatLeadsForExport(leads: Array<{
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string | null;
  state: string | null;
  project_type: string;
  status: string;
  lead_source: string | null;
  created_at: string | null;
}>) {
  return leads.map(lead => ({
    'Customer Name': lead.customer_name,
    'Phone': lead.phone,
    'Email': lead.email || '',
    'Address': lead.address,
    'City': lead.city || '',
    'State': lead.state || '',
    'Project Type': lead.project_type?.toUpperCase(),
    'Status': formatStatus(lead.status),
    'Lead Source': lead.lead_source || '',
    'Created Date': lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : ''
  }));
}

export function formatProjectsForExport(projects: Array<{
  project_name: string;
  project_type: string;
  status: string | null;
  capacity_kw: number | null;
  total_amount: number | null;
  start_date: string | null;
  expected_end_date: string | null;
  created_at: string | null;
}>) {
  return projects.map(project => ({
    'Project Name': project.project_name,
    'Type': project.project_type?.toUpperCase(),
    'Status': formatStatus(project.status || ''),
    'Capacity (kW)': project.capacity_kw || '',
    'Total Amount (₹)': project.total_amount || '',
    'Start Date': project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : '',
    'Expected End Date': project.expected_end_date ? new Date(project.expected_end_date).toLocaleDateString('en-IN') : '',
    'Created Date': project.created_at ? new Date(project.created_at).toLocaleDateString('en-IN') : ''
  }));
}

export function formatPaymentsForExport(payments: Array<{
  amount: number;
  payment_type: string;
  payment_method: string | null;
  status: string | null;
  received_date: string | null;
  transaction_ref: string | null;
  created_at: string | null;
}>) {
  return payments.map(payment => ({
    'Amount (₹)': payment.amount,
    'Type': formatStatus(payment.payment_type),
    'Method': payment.payment_method || '',
    'Status': formatStatus(payment.status || ''),
    'Received Date': payment.received_date ? new Date(payment.received_date).toLocaleDateString('en-IN') : '',
    'Transaction Ref': payment.transaction_ref || '',
    'Created Date': payment.created_at ? new Date(payment.created_at).toLocaleDateString('en-IN') : ''
  }));
}

export function formatExpensesForExport(expenses: Array<{
  amount: number;
  expense_type: string;
  description: string | null;
  status: string | null;
  expense_date: string | null;
  created_at: string | null;
}>) {
  return expenses.map(expense => ({
    'Amount (₹)': expense.amount,
    'Type': formatStatus(expense.expense_type),
    'Description': expense.description || '',
    'Status': formatStatus(expense.status || ''),
    'Expense Date': expense.expense_date ? new Date(expense.expense_date).toLocaleDateString('en-IN') : '',
    'Created Date': expense.created_at ? new Date(expense.created_at).toLocaleDateString('en-IN') : ''
  }));
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
