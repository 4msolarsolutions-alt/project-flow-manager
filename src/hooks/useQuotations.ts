import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Quotation = Database['public']['Tables']['quotations']['Row'];
type QuotationInsert = Database['public']['Tables']['quotations']['Insert'];
type QuotationUpdate = Database['public']['Tables']['quotations']['Update'];

export function useQuotations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quotations, isLoading, error } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          leads (
            customer_name,
            phone,
            address
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createQuotation = useMutation({
    mutationFn: async (quotation: QuotationInsert) => {
      const { data, error } = await supabase
        .from('quotations')
        .insert(quotation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Quotation Created',
        description: 'New quotation has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateQuotation = useMutation({
    mutationFn: async ({ id, ...updates }: QuotationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('quotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: 'Quotation Updated',
        description: 'Quotation has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const sendQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('quotations')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: 'Quotation Sent',
        description: 'Quotation has been sent to the customer.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({
        title: 'Quotation Deleted',
        description: 'Quotation has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    quotations,
    isLoading,
    error,
    createQuotation,
    updateQuotation,
    sendQuotation,
    deleteQuotation,
  };
}

export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: ['quotations', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          leads (
            customer_name,
            phone,
            address,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
