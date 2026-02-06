import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CustomerDocument {
  id: string;
  project_id: string | null;
  lead_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  visible_to_customer: boolean;
  uploaded_by: string | null;
  created_at: string;
}

// Document type labels for display
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  site_visit: 'Site Visit Report',
  bom1: 'Bill of Materials (Initial)',
  quotation: 'Quotation',
  work_order: 'Work Order',
  bom2: 'Bill of Materials (Final)',
  panel_details: 'Panel Details',
  inverter_details: 'Inverter Details',
  battery_details: 'Battery Details',
  material_list: 'Material List',
  eb_document: 'EB Document',
  completion_report: 'Completion Report',
  gst_invoice: 'GST Invoice',
  ceg_approval: 'CEG Approval',
  other: 'Other Document',
};

export function useCustomerDocuments(projectId: string | undefined) {
  const { user } = useAuth();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['customer-documents', projectId],
    queryFn: async () => {
      if (!projectId || !user) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('visible_to_customer', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerDocument[];
    },
    enabled: !!projectId && !!user,
  });

  // Group documents by type
  const documentsByType = documents?.reduce((acc, doc) => {
    const type = doc.document_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, CustomerDocument[]>) ?? {};

  return {
    documents,
    documentsByType,
    isLoading,
    error,
    documentsCount: documents?.length ?? 0,
  };
}
