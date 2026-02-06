import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectStage {
  id: string;
  project_id: string;
  stage_order: number;
  stage_name: string;
  stage_key: string;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

// Stage icons for display
export const STAGE_ICONS: Record<string, string> = {
  project_created: '📋',
  site_visit_pending: '🔍',
  site_visit_completed: '✅',
  quotation_sent: '📄',
  payment_pending: '💳',
  material_ordered: '📦',
  material_delivered: '🚚',
  installation_started: '🔧',
  completed: '🎉',
  oam_active: '🛠️',
};

export function useProjectStages(projectId: string | undefined) {
  const { data: stages, isLoading, error, refetch } = useQuery({
    queryKey: ['project-stages', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('stage_order', { ascending: true });

      if (error) throw error;
      return data as ProjectStage[];
    },
    enabled: !!projectId,
  });

  const currentStageIndex = stages?.findIndex(s => !s.is_completed) ?? -1;
  const currentStage = currentStageIndex >= 0 ? stages?.[currentStageIndex] : stages?.[stages.length - 1];
  const completedStages = stages?.filter(s => s.is_completed).length ?? 0;
  const totalStages = stages?.length ?? 10;
  const progressPercent = Math.round((completedStages / totalStages) * 100);

  return {
    stages,
    isLoading,
    error,
    refetch,
    currentStage,
    currentStageIndex,
    completedStages,
    totalStages,
    progressPercent,
  };
}
