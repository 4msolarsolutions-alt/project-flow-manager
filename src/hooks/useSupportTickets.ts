import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  customer_id: string;
  project_id: string | null;
  issue_type: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  project_id: string;
  issue_type: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export function useSupportTickets(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['support-tickets', user?.id, projectId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('support_tickets')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async (ticketData: CreateTicketData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          customer_id: user.id,
          project_id: ticketData.project_id,
          issue_type: ticketData.issue_type,
          subject: ticketData.subject,
          message: ticketData.message,
          priority: ticketData.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Support ticket created successfully');
    },
    onError: (error) => {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    },
  });

  const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length ?? 0;
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length ?? 0;

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    openTickets,
    resolvedTickets,
  };
}
