import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addYears, isAfter, isBefore, addDays } from 'date-fns';

export interface Warranty {
  id: string;
  project_id: string;
  component_type: 'panel' | 'inverter' | 'battery' | 'workmanship';
  brand_name: string | null;
  model_name: string | null;
  product_warranty_years: number;
  performance_warranty_years: number | null;
  start_date: string | null;
  end_date: string | null;
  serial_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface WarrantyWithStatus extends Warranty {
  productEndDate: Date | null;
  performanceEndDate: Date | null;
  productStatus: 'active' | 'expiring_soon' | 'expired' | 'not_started';
  performanceStatus: 'active' | 'expiring_soon' | 'expired' | 'not_started' | 'not_applicable';
  daysUntilProductExpiry: number | null;
  daysUntilPerformanceExpiry: number | null;
}

export function useWarranties(projectId: string | undefined) {
  const { data: warranties, isLoading, error } = useQuery({
    queryKey: ['warranties', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('warranties')
        .select('*')
        .eq('project_id', projectId)
        .order('component_type', { ascending: true });

      if (error) throw error;
      return data as Warranty[];
    },
    enabled: !!projectId,
  });

  // Calculate warranty status for each warranty
  const warrantiesWithStatus: WarrantyWithStatus[] = (warranties ?? []).map(warranty => {
    const today = new Date();
    const startDate = warranty.start_date ? new Date(warranty.start_date) : null;
    
    // Calculate product warranty end date
    const productEndDate = startDate && warranty.product_warranty_years > 0
      ? addYears(startDate, warranty.product_warranty_years)
      : null;
    
    // Calculate performance warranty end date
    const performanceEndDate = startDate && warranty.performance_warranty_years
      ? addYears(startDate, warranty.performance_warranty_years)
      : null;

    // Calculate days until expiry
    const daysUntilProductExpiry = productEndDate
      ? Math.ceil((productEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const daysUntilPerformanceExpiry = performanceEndDate
      ? Math.ceil((performanceEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine product warranty status
    let productStatus: WarrantyWithStatus['productStatus'] = 'not_started';
    if (productEndDate) {
      if (isBefore(productEndDate, today)) {
        productStatus = 'expired';
      } else if (isBefore(productEndDate, addDays(today, 30))) {
        productStatus = 'expiring_soon';
      } else {
        productStatus = 'active';
      }
    }

    // Determine performance warranty status
    let performanceStatus: WarrantyWithStatus['performanceStatus'] = 'not_applicable';
    if (performanceEndDate) {
      if (isBefore(performanceEndDate, today)) {
        performanceStatus = 'expired';
      } else if (isBefore(performanceEndDate, addDays(today, 30))) {
        performanceStatus = 'expiring_soon';
      } else {
        performanceStatus = 'active';
      }
    }

    return {
      ...warranty,
      productEndDate,
      performanceEndDate,
      productStatus,
      performanceStatus,
      daysUntilProductExpiry,
      daysUntilPerformanceExpiry,
    };
  });

  const activeWarranties = warrantiesWithStatus.filter(w => w.productStatus === 'active').length;
  const expiringWarranties = warrantiesWithStatus.filter(w => w.productStatus === 'expiring_soon').length;

  return {
    warranties: warrantiesWithStatus,
    isLoading,
    error,
    activeWarranties,
    expiringWarranties,
  };
}
