import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignedUrlResult {
  path: string;
  signedUrl: string | null;
  error?: string;
}

export function useSignedUrls(paths: string[] | undefined) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignedUrls = useCallback(async (urlPaths: string[]) => {
    if (!urlPaths || urlPaths.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('get-signed-url', {
        body: { 
          paths: urlPaths,
          bucket: 'site-visits',
          expiresIn: 3600 // 1 hour
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const urlMap: Record<string, string> = {};
      (response.data.signedUrls as SignedUrlResult[]).forEach((result) => {
        if (result.signedUrl) {
          urlMap[result.path] = result.signedUrl;
        }
      });

      setSignedUrls(urlMap);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching signed URLs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paths && paths.length > 0) {
      fetchSignedUrls(paths);
    }
  }, [paths?.join(','), fetchSignedUrls]);

  const getSignedUrl = useCallback((originalPath: string) => {
    return signedUrls[originalPath] || null;
  }, [signedUrls]);

  return {
    signedUrls,
    getSignedUrl,
    isLoading,
    error,
    refetch: () => paths && fetchSignedUrls(paths),
  };
}
