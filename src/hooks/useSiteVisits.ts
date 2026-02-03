import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SiteVisit = Database['public']['Tables']['site_visits']['Row'];
type SiteVisitInsert = Database['public']['Tables']['site_visits']['Insert'];
type SiteVisitUpdate = Database['public']['Tables']['site_visits']['Update'];

export function useSiteVisits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: siteVisits, isLoading, error } = useQuery({
    queryKey: ['site_visits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_visits')
        .select(`
          *,
          leads (
            customer_name,
            address,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createSiteVisit = useMutation({
    mutationFn: async (visit: SiteVisitInsert) => {
      const { data, error } = await supabase
        .from('site_visits')
        .insert(visit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_visits'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Site Visit Scheduled',
        description: 'Site visit has been scheduled successfully.',
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

  const updateSiteVisit = useMutation({
    mutationFn: async ({ id, ...updates }: SiteVisitUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('site_visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_visits'] });
      toast({
        title: 'Site Visit Updated',
        description: 'Site visit details have been updated.',
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

  const completeSiteVisit = useMutation({
    mutationFn: async ({ id, ...data }: SiteVisitUpdate & { id: string }) => {
      const { error } = await supabase
        .from('site_visits')
        .update({
          ...data,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_visits'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Site Visit Completed',
        description: 'Site visit has been marked as completed.',
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
    siteVisits,
    isLoading,
    error,
    createSiteVisit,
    updateSiteVisit,
    completeSiteVisit,
  };
}

export function useSiteVisit(id: string | undefined) {
  return useQuery({
    queryKey: ['site_visits', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('site_visits')
        .select(`
          *,
          leads (
            customer_name,
            address,
            phone,
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
