import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useExpenses(projectId) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          projects (
            project_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createExpense = useMutation({
    mutationFn: async (expense) => {
      // Auto-calculate amount for food expenses
      let amount = expense.amount;
      if (expense.expense_type === 'food' && expense.persons && expense.days) {
        amount = expense.persons * expense.days * (expense.rate_per_day || 200);
      }
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, amount })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense Added',
        description: 'Expense has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense Updated',
        description: 'Expense has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveExpense = useMutation({
    mutationFn: async (id) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('expenses')
        .update({
          status: 'approved',
          approved_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense Approved',
        description: 'Expense has been approved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense Deleted',
        description: 'Expense has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate totals by type
  const totals = expenses?.reduce(
    (acc, expense) => {
      const amount = Number(expense.amount) || 0;
      acc.total += amount;
      if (expense.expense_type === 'food') acc.food += amount;
      if (expense.expense_type === 'travel') acc.travel += amount;
      if (expense.expense_type === 'material') acc.material += amount;
      if (expense.expense_type === 'other') acc.other += amount;
      return acc;
    },
    { total: 0, food: 0, travel: 0, material: 0, other: 0 }
  ) || { total: 0, food: 0, travel: 0, material: 0, other: 0 };

  return {
    expenses,
    totals,
    isLoading,
    error,
    createExpense,
    updateExpense,
    approveExpense,
    deleteExpense,
  };
}
