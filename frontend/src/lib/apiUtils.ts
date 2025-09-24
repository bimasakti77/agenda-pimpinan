/**
 * API Utility Functions
 * Helper functions for API calls that need to use centralized configuration
 */

import { apiConfig } from '@/config/env';

/**
 * Get the full API URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${apiConfig.baseUrl}/${cleanEndpoint}`;
};

/**
 * Make a fetch request with centralized configuration
 * This is a temporary helper for components that haven't been migrated to apiService yet
 */
export const apiFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers: defaultHeaders,
  });
};

/**
 * Make an authenticated fetch request
 * Automatically adds Authorization header with stored token
 */
export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { getStoredToken } = await import('@/lib/auth');
  
  const token = getStoredToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return apiFetch(endpoint, {
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
 */
export const authenticatedApiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const response = await authenticatedFetch(endpoint, options);
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};
