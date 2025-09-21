import { useState, useEffect, useCallback } from 'react';
import { getStoredToken, refreshAccessToken } from '@/lib/auth';
import toast from 'react-hot-toast';

interface UseApiOptions extends RequestInit {
  autoFetch?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useApi = <T = any>(
  url: string, 
  options: UseApiOptions = {}
): UseApiReturn<T> => {
  const { autoFetch = true, ...fetchOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getStoredToken();
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          const newToken = getStoredToken();
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
            },
          });
          
          if (retryResponse.ok) {
            const result = await retryResponse.json();
            setData(result.data || result);
          } else {
            throw new Error('Failed to fetch data after token refresh');
          }
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          return;
        }
      } else if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          setData(result.data || result);
        } else {
          // If response is not JSON, get text to see what we received
          const text = await response.text();
          console.error('Non-JSON response received:', text);
          throw new Error('Server returned non-JSON response');
        }
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch data');
        } else {
          // If error response is not JSON, get text
          const text = await response.text();
          console.error('Error response (non-JSON):', text);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(fetchOptions)]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { data, loading, error, refetch: fetchData };
};
