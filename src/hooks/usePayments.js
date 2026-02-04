import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast.ts';

export function usePayments(projectId) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments', projectId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          projects (
            project_name
          ),
          leads (
            customer_name
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

  const createPayment = useMutation({
    mutationFn: async (payment) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment Recorded',
        description: 'Payment has been recorded successfully.',
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

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment Updated',
        description: 'Payment has been updated successfully.',
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

  const deletePayment = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: 'Payment Deleted',
        description: 'Payment has been removed.',
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

  // Calculate totals
  const totals = payments?.reduce(
    (acc, payment) => {
      acc.total += Number(payment.amount) || 0;
      if (payment.status === 'completed') {
        acc.received += Number(payment.amount) || 0;
      } else {
        acc.pending += Number(payment.amount) || 0;
      }
      return acc;
    },
    { total: 0, received: 0, pending: 0 }
  ) || { total: 0, received: 0, pending: 0 };

  return {
    payments,
    totals,
    isLoading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
  };
}
