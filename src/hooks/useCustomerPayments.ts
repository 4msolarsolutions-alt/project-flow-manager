import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CustomerPayment {
  id: string;
  project_id: string;
  lead_id: string | null;
  amount: number;
  payment_type: 'advance' | 'progress' | 'final';
  payment_method: string | null;
  status: 'pending' | 'partial' | 'completed';
  transaction_ref: string | null;
  received_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentSummary {
  totalProjectCost: number;
  amountPaid: number;
  pendingAmount: number;
  paymentsCount: number;
}

export function useCustomerPayments(projectId: string | undefined) {
  const { user } = useAuth();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['customer-payments', projectId],
    queryFn: async () => {
      if (!projectId || !user) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId)
        .order('received_date', { ascending: false });

      if (error) throw error;
      return data as CustomerPayment[];
    },
    enabled: !!projectId && !!user,
  });

  const { data: projectData } = useQuery({
    queryKey: ['project-total', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('projects')
        .select('total_amount')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Calculate payment summary
  const totalProjectCost = projectData?.total_amount ?? 0;
  const amountPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;
  const pendingAmount = Math.max(0, totalProjectCost - amountPaid);

  const summary: PaymentSummary = {
    totalProjectCost,
    amountPaid,
    pendingAmount,
    paymentsCount: payments?.length ?? 0,
  };

  return {
    payments,
    isLoading,
    error,
    summary,
  };
}
