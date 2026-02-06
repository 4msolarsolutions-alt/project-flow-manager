import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CustomerProject {
  id: string;
  project_name: string;
  project_type: string;
  status: string | null;
  capacity_kw: number | null;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string | null;
  leads: {
    customer_name: string;
    phone: string;
    address: string;
    email: string | null;
  } | null;
}

// Project status flow for tracking
export const PROJECT_STATUS_FLOW = [
  { key: 'planning', label: 'Project Created', icon: '📋' },
  { key: 'site_visit_pending', label: 'Site Visit Pending', icon: '🔍' },
  { key: 'site_visit_completed', label: 'Site Visit Completed', icon: '✅' },
  { key: 'quotation_sent', label: 'Quotation Sent', icon: '📄' },
  { key: 'payment_pending', label: 'Payment Pending', icon: '💳' },
  { key: 'material_ordered', label: 'Material Ordered', icon: '📦' },
  { key: 'material_delivered', label: 'Material Delivered', icon: '🚚' },
  { key: 'installation_started', label: 'Installation Started', icon: '🔧' },
  { key: 'completed', label: 'Completed', icon: '🎉' },
  { key: 'oam_active', label: 'O&M Active', icon: '🛠️' },
];

export function useCustomerProjects() {
  const { user, profile } = useAuth();

  // Query projects where the lead's customer_id matches the current user
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['customer-projects', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First find leads where customer_id = current user
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('customer_id', user.id);

      if (leadsError) throw leadsError;
      if (!leads || leads.length === 0) return [];

      const leadIds = leads.map(l => l.id);

      // Then find projects linked to those leads
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          leads (
            customer_name,
            phone,
            address,
            email
          )
        `)
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      return projectsData as CustomerProject[];
    },
    enabled: !!user && profile?.login_type === 'customer',
  });

  const hasProjects = (projects?.length || 0) > 0;

  return {
    projects,
    isLoading,
    error,
    hasProjects,
  };
}

// Get the status index for progress tracking
export function getStatusIndex(status: string | null): number {
  if (!status) return 0;
  const index = PROJECT_STATUS_FLOW.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
}
