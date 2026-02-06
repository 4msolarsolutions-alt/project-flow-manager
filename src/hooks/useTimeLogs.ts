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
  status: string | null;
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

// Helper to format hours from decimal to "Xh Ym"
export function formatHoursMinutes(hours: number | null): string {
  if (hours === null || hours === undefined) return "-";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
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
      return data as TimeLog[];
    },
    enabled: !!user,
  });

  // Get current active session (status = 'active')
  const { data: activeSession } = useQuery({
    queryKey: ['time-logs', 'active', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Find active session using status column
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('time_in', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as TimeLog | null;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Calculate today's total hours (completed sessions only, all work types)
  const { data: todayStats } = useQuery({
    queryKey: ['time-logs', 'today-stats', user?.id],
    queryFn: async () => {
      if (!user) return { totalMinutes: 0, projectMinutes: 0, leadMinutes: 0 };
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_logs')
        .select('total_hours, work_type')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      let totalMinutes = 0;
      let projectMinutes = 0;
      let leadMinutes = 0;
      
      data?.forEach(log => {
        const minutes = Math.round((log.total_hours || 0) * 60);
        totalMinutes += minutes;
        if (log.work_type === 'project') {
          projectMinutes += minutes;
        } else if (log.work_type === 'lead') {
          leadMinutes += minutes;
        }
      });
      
      return { totalMinutes, projectMinutes, leadMinutes };
    },
    enabled: !!user,
  });

  // Calculate this month's total hours (completed sessions only)
  const { data: monthStats } = useQuery({
    queryKey: ['time-logs', 'month-stats', user?.id],
    queryFn: async () => {
      if (!user) return { totalMinutes: 0, projectMinutes: 0, leadMinutes: 0 };
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('time_logs')
        .select('total_hours, work_type')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);
      
      if (error) throw error;
      
      let totalMinutes = 0;
      let projectMinutes = 0;
      let leadMinutes = 0;
      
      data?.forEach(log => {
        const minutes = Math.round((log.total_hours || 0) * 60);
        totalMinutes += minutes;
        if (log.work_type === 'project') {
          projectMinutes += minutes;
        } else if (log.work_type === 'lead') {
          leadMinutes += minutes;
        }
      });
      
      return { totalMinutes, projectMinutes, leadMinutes };
    },
    enabled: !!user,
  });

  // Clock In
  const clockIn = useMutation({
    mutationFn: async (data: ClockInData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Validation: Require project for PROJECT work type
      if (data.work_type === 'project' && (!data.project_id || data.project_id === 'none')) {
        throw new Error('Please select a project for project work');
      }
      
      const { data: result, error } = await supabase
        .from('time_logs')
        .insert({
          user_id: user.id,
          work_type: data.work_type || 'project',
          project_id: data.project_id && data.project_id !== 'none' ? data.project_id : null,
          lead_id: data.lead_id && data.lead_id !== 'none' ? data.lead_id : null,
          time_in: new Date().toISOString(),
          latitude_in: data.latitude,
          longitude_in: data.longitude,
          notes: data.notes || null,
          status: 'active',
        })
        .select()
        .single();
      
      if (error) {
        // Handle the trigger error for multiple active sessions
        if (error.message.includes('already clocked in')) {
          throw new Error('You are already clocked in. Please clock out first.');
        }
        throw error;
      }
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
          status: 'completed', // Explicitly set status
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
    todayStats,
    monthStats,
    clockIn,
    clockOut,
    formatHoursMinutes,
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
