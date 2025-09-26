/**
 * Custom hook for API calls using the centralized API service
 * Provides loading states, error handling, and automatic refetching
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiService } from '@/services/apiService';
import { API_ENDPOINTS } from '@/services/apiEndpoints';
import { RequestConfig } from '@/types/api';
import toast from 'react-hot-toast';

interface UseApiOptions extends RequestConfig {
  autoFetch?: boolean;
  showErrorToast?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic API hook for GET requests
 */
export const useApi = <T = any>(
  endpoint: string, 
  params?: Record<string, string | number | boolean>,
  options: UseApiOptions = {}
): UseApiReturn<T> => {
  const { autoFetch = true, showErrorToast = true, ...config } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  
  // Use refs to store stable values
  const paramsRef = useRef(params);
  const configRef = useRef(config);
  const endpointRef = useRef(endpoint);
  
  // Update refs when values change
  paramsRef.current = params;
  configRef.current = config;
  endpointRef.current = endpoint;
  
  // Use ref to track if we've already fetched data
  const hasFetched = useRef(false);
  const fetchPromise = useRef<Promise<void> | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchPromise.current) {
      return fetchPromise.current;
    }
    
    fetchPromise.current = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.get<T>(endpointRef.current, paramsRef.current, configRef.current);
        if (isMounted.current) {
          setData(result);
          hasFetched.current = true;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        if (isMounted.current) {
          setError(errorMessage);
        }
        
        if (showErrorToast) {
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        fetchPromise.current = null;
      }
    })();
    
    return fetchPromise.current;
  }, [showErrorToast]);

  useEffect(() => {
    if (autoFetch && !hasFetched.current && isMounted.current) {
      fetchData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [autoFetch]); // Remove fetchData from dependencies

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for POST requests
 */
export const useApiPost = <T = any>(
  endpoint: string,
  options: UseApiOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data?: any): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<T>(endpoint, data, options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(options)]);

  return { execute, loading, error };
};

/**
 * Hook for PUT requests
 */
export const useApiPut = <T = any>(
  endpoint: string,
  options: UseApiOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data?: any): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.put<T>(endpoint, data, options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(options)]);

  return { execute, loading, error };
};

/**
 * Hook for DELETE requests
 */
export const useApiDelete = <T = any>(
  endpoint: string,
  options: UseApiOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.delete<T>(endpoint, options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(options)]);

  return { execute, loading, error };
};

/**
 * Hook for agenda-specific API calls
 */
export const useAgendaApi = () => {
  const getAgendas = useCallback((params?: Record<string, string | number | boolean>) => {
    return apiService.get(API_ENDPOINTS.AGENDA.LIST, params);
  }, []);

  const getAgendaById = useCallback((id: number) => {
    return apiService.get(API_ENDPOINTS.AGENDA.GET_BY_ID(id));
  }, []);

  const createAgenda = useCallback((data: any) => {
    return apiService.post(API_ENDPOINTS.AGENDA.CREATE, data);
  }, []);

  const updateAgenda = useCallback((id: number, data: any) => {
    return apiService.put(API_ENDPOINTS.AGENDA.UPDATE(id), data);
  }, []);

  const deleteAgenda = useCallback((id: number) => {
    return apiService.delete(API_ENDPOINTS.AGENDA.DELETE(id));
  }, []);

  const updateAgendaStatus = useCallback((id: number, data: any) => {
    return apiService.patch(API_ENDPOINTS.AGENDA.UPDATE_STATUS(id), data);
  }, []);

  return {
    getAgendas,
    getAgendaById,
    createAgenda,
    updateAgenda,
    deleteAgenda,
    updateAgendaStatus,
  };
};

/**
 * Hook for user-specific API calls
 */
export const useUserApi = () => {
  const getUsers = useCallback((params?: Record<string, string | number | boolean>) => {
    return apiService.get(API_ENDPOINTS.USERS.LIST, params);
  }, []);

  const getUserById = useCallback((id: number) => {
    return apiService.get(API_ENDPOINTS.USERS.GET_BY_ID(id));
  }, []);

  const createUser = useCallback((data: any) => {
    return apiService.post(API_ENDPOINTS.USERS.CREATE, data);
  }, []);

  const updateUser = useCallback((id: number, data: any) => {
    return apiService.put(API_ENDPOINTS.USERS.UPDATE(id), data);
  }, []);

  const deleteUser = useCallback((id: number) => {
    return apiService.delete(API_ENDPOINTS.USERS.DELETE(id));
  }, []);

  const checkNipAvailability = useCallback((nip: string, excludeUserId?: number) => {
    const params: Record<string, any> = { nip };
    if (excludeUserId) {
      params.excludeUserId = excludeUserId;
    }
    return apiService.get(API_ENDPOINTS.USERS.CHECK_NIP, params);
  }, []);

  return {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    checkNipAvailability,
  };
};

export default useApi;
