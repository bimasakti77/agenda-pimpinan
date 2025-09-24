/**
 * Migration Helper for Environment Variables
 * Temporary helper functions to migrate hardcoded URLs to environment variables
 */

import { apiConfig } from '@/config/env';

/**
 * Get API URL with environment configuration
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${apiConfig.baseUrl}/${cleanEndpoint}`;
};

/**
 * Make authenticated fetch request with environment configuration
 * This is a temporary helper for components that haven't been migrated to apiService yet
 */
export const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { getStoredToken } = await import('@/lib/auth');
  
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const url = getApiUrl(endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * Handle API response with error checking
 */
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Keep default error message
      }
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
};

/**
 * Make authenticated API call with error handling
 * This is a temporary helper for components that haven't been migrated to apiService yet
 */
export const makeAuthenticatedApiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const response = await makeAuthenticatedRequest(endpoint, options);
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Migration helper for dashboard stats
 */
export const getDashboardStatsUrl = (userRole: string, userId?: number): string => {
  const baseEndpoint = '/agenda/stats/dashboard';
  
  if (userRole === 'user' && userId) {
    return `${baseEndpoint}?user_id=${userId}`;
  }
  
  return baseEndpoint;
};

/**
 * Migration helper for agenda list with filters
 */
export const getAgendaListUrl = (filters: Record<string, any> = {}): string => {
  const baseEndpoint = '/agenda';
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
};

/**
 * Migration helper for user list with filters
 */
export const getUserListUrl = (filters: Record<string, any> = {}): string => {
  const baseEndpoint = '/users';
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
};

/**
 * Migration helper for specific user by ID
 */
export const getUserByIdUrl = (userId: number): string => {
  return `/users/${userId}`;
};

/**
 * Migration helper for specific agenda by ID
 */
export const getAgendaByIdUrl = (agendaId: number): string => {
  return `/agenda/${agendaId}`;
};

/**
 * Migration helper for monthly chart data
 */
export const getMonthlyChartUrl = (): string => {
  return '/agenda/stats/monthly';
};

/**
 * Migration helper for recent agendas
 */
export const getRecentAgendasUrl = (limit: number = 5): string => {
  return `/agenda?limit=${limit}&sort=created_at&order=desc`;
};

/**
 * Migration helper for calendar agendas
 */
export const getCalendarAgendasUrl = (limit: number = 100): string => {
  return `/agenda?limit=${limit}`;
};

/**
 * Migration helper for user filter
 */
export const getUserFilterUrl = (limit: number = 100): string => {
  return `/users?limit=${limit}`;
};
