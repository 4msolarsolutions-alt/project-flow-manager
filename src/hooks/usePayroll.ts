import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Payroll {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_hours: number;
  hourly_rate: number;
  base_salary: number;
  expense_reimbursement: number;
  deductions: number;
  total_payable: number;
  status: 'draft' | 'generated' | 'approved' | 'paid';
  generated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    hourly_rate: number | null;
    salary_type: string | null;
    monthly_salary: number | null;
    daily_wage: number | null;
    food_allowance_per_day: number | null;
    travel_rate_per_km: number | null;
  } | null;
}

interface GeneratePayrollData {
  user_id: string;
  month: number;
  year: number;
  hourly_rate: number;
  salary_type?: string;
  monthly_salary?: number;
  daily_wage?: number;
  food_allowance_per_day?: number;
  travel_rate_per_km?: number;
}

export function usePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all payroll records
  const { data: payrollRecords, isLoading, error } = useQuery({
    queryKey: ['payroll'],
    queryFn: async () => {
      // First get payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (payrollError) throw payrollError;

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(payrollData.map(p => p.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, hourly_rate, salary_type, monthly_salary, daily_wage, food_allowance_per_day, travel_rate_per_km')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to payroll records
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      
      return payrollData.map(record => ({
        ...record,
        profiles: profileMap.get(record.user_id) || null,
      })) as Payroll[];
    },
    enabled: !!user,
  });

  // Calculate total hours from time_logs for a specific month/year
  // IMPORTANT: Only count PROJECT time logs (not LEAD - those are tracking only)
  const calculateHoursForPeriod = async (userId: string, month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('time_logs')
      .select('total_hours')
      .eq('user_id', userId)
      .eq('work_type', 'project') // Only count PROJECT time, not LEAD
      .gte('date', startDate)
      .lte('date', endDate)
      .not('total_hours', 'is', null);

    if (error) throw error;

    return data.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);
  };

  // Calculate food and travel allowance from time logs
  const calculateAllowancesForPeriod = async (userId: string, month: number, year: number, foodRate: number, travelRate: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('time_logs')
      .select('total_hours, distance_km')
      .eq('user_id', userId)
      .eq('work_type', 'project')
      .gte('date', startDate)
      .lte('date', endDate)
      .not('total_hours', 'is', null);

    if (error) throw error;

    const daysWorked = data.filter(l => (Number(l.total_hours) || 0) > 0).length;
    const totalKm = data.reduce((sum, l) => sum + (Number(l.distance_km) || 0), 0);

    return {
      foodAllowance: daysWorked * foodRate,
      travelAllowance: totalKm * travelRate,
    };
  };

  // Calculate approved expense reimbursement for a period
  const calculateExpensesForPeriod = async (userId: string, month: number, year: number) => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('submitted_by', userId)
      .eq('status', 'approved')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (error) throw error;

    return data.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
  };

  // Generate payroll for an employee
  const generatePayroll = useMutation({
    mutationFn: async (data: GeneratePayrollData) => {
      if (!user) throw new Error('User not authenticated');

      const salaryType = data.salary_type || 'monthly';
      const foodRate = data.food_allowance_per_day ?? 200;
      const travelRate = data.travel_rate_per_km ?? 10;

      // Calculate hours from time logs
      const totalHours = await calculateHoursForPeriod(data.user_id, data.month, data.year);
      
      // Calculate labor cost based on salary type
      let laborCost = 0;
      if (salaryType === 'hourly') {
        laborCost = totalHours * (data.hourly_rate || 0);
      } else if (salaryType === 'daily') {
        laborCost = ((data.daily_wage || 0) / 8) * totalHours;
      } else {
        laborCost = ((data.monthly_salary || 0) / 26 / 8) * totalHours;
      }

      // Calculate food & travel allowances
      const { foodAllowance, travelAllowance } = await calculateAllowancesForPeriod(data.user_id, data.month, data.year, foodRate, travelRate);

      // Calculate approved expenses
      const expenseReimbursement = await calculateExpensesForPeriod(data.user_id, data.month, data.year);

      // Total payable = laborCost + foodAllowance + travelAllowance + approvedExpenses
      const totalPayable = laborCost + foodAllowance + travelAllowance + expenseReimbursement;

      const { data: result, error } = await supabase
        .from('payroll')
        .upsert({
          user_id: data.user_id,
          month: data.month,
          year: data.year,
          total_hours: totalHours,
          hourly_rate: data.hourly_rate,
          base_salary: laborCost,
          expense_reimbursement: expenseReimbursement + foodAllowance + travelAllowance,
          total_payable: totalPayable,
          status: 'generated',
          generated_by: user.id,
        }, {
          onConflict: 'user_id,month,year',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({
        title: 'Payroll Generated',
        description: 'Payroll has been calculated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve payroll
  const approvePayroll = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payroll')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({
        title: 'Payroll Approved',
        description: 'Payroll has been approved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark payroll as paid
  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('payroll')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({
        title: 'Payroll Paid',
        description: 'Payroll has been marked as paid.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update deductions
  const updateDeductions = useMutation({
    mutationFn: async ({ id, deductions, notes }: { id: string; deductions: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('payroll')
        .update({ deductions, notes })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast({
        title: 'Deductions Updated',
        description: 'Payroll deductions have been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    payrollRecords,
    isLoading,
    error,
    generatePayroll,
    approvePayroll,
    markAsPaid,
    updateDeductions,
  };
}

// Hook to get employees for payroll generation
export function useEmployeesForPayroll() {
  return useQuery({
    queryKey: ['employees-for-payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, hourly_rate, salary_type, monthly_salary, daily_wage, food_allowance_per_day, travel_rate_per_km')
        .eq('login_type', 'employee')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
  });
}
