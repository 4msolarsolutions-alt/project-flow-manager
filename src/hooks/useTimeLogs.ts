import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface TimeLog {
  id: string;
  user_id: string;
  work_type: string | null;
  project_id: string | null;
  lead_id: string | null;
  date: string;
  time_in: string | null;
  time_out: string | null;
  latitude_in: string | null;
  longitude_in: string | null;
  latitude_out: string | null;
  longitude_out: string | null;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    project_name: string;
  } | null;
  leads?: {
    customer_name: string;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface ClockInData {
  work_type?: string;
  project_id?: string;
  lead_id?: string;
  latitude: string;
  longitude: string;
  notes?: string;
}

interface ClockOutData {
  id: string;
  latitude: string;
  longitude: string;
  notes?: string;
}

export function useTimeLogs() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all time logs (admins see all, employees see their own)
  const { data: timeLogs, isLoading, error } = useQuery({
    queryKey: ['time-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_logs')
        .select(`
          *,
          projects (project_name),
          leads (customer_name)
        `)
        .order('date', { ascending: false })
        .order('time_in', { ascending: false });
      
      if (error) throw error;
      return data as (TimeLog & { leads?: { customer_name: string } | null })[];
    },
    enabled: !!user,
  });

  // Get current active session (clocked in but not out) - regardless of date
  const { data: activeSession } = useQuery({
    queryKey: ['time-logs', 'active', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Find the most recent session that hasn't been clocked out yet
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('time_out', null)
        .order('time_in', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      // Return the first (most recent) active session or null
      return (data && data.length > 0 ? data[0] : null) as TimeLog | null;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Clock In
  const clockIn = useMutation({
    mutationFn: async (data: ClockInData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: result, error } = await supabase
        .from('time_logs')
        .insert({
          user_id: user.id,
          work_type: data.work_type || 'project',
          project_id: data.project_id || null,
          lead_id: data.lead_id || null,
          time_in: new Date().toISOString(),
          latitude_in: data.latitude,
          longitude_in: data.longitude,
          notes: data.notes || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] });
      toast({
        title: 'Clocked In',
        description: 'Your attendance has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Clock In Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Clock Out
  const clockOut = useMutation({
    mutationFn: async (data: ClockOutData) => {
      const { data: result, error } = await supabase
        .from('time_logs')
        .update({
          time_out: new Date().toISOString(),
          latitude_out: data.latitude,
          longitude_out: data.longitude,
          notes: data.notes,
        })
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-logs'] });
      toast({
        title: 'Clocked Out',
        description: 'Your session has been completed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Clock Out Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    timeLogs,
    isLoading,
    error,
    activeSession,
    clockIn,
    clockOut,
  };
}

// Hook to get current GPS location
export function useGeolocation() {
  const getLocation = (): Promise<{ latitude: string; longitude: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Location permission denied. Please enable GPS.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information is unavailable.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out.'));
              break;
            default:
              reject(new Error('An unknown error occurred.'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { getLocation };
}
