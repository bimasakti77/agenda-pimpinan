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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<T>(endpoint, params, config);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, config, showErrorToast]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, endpoint]);

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
