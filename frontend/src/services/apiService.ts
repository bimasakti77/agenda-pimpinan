/**
 * API Service with Authentication and Error Handling
 * Centralized API service using the HTTP client
 */

import { httpClient } from './httpClient';
import { getStoredToken, refreshAccessToken } from '@/lib/auth';
import { ApiResponse, RequestConfig } from '@/types/api';
import { isDebugEnabled } from '@/config/env';

class ApiService {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.setupInterceptors();
  }

  /**
   * Setup authentication and error interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for authentication
    httpClient.addRequestInterceptor(async (config) => {
      const token = getStoredToken();
      
      if (!token) {
        // No token, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('No authentication token');
      }

      return {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        },
      };
    });

    // Response interceptor for token refresh
    httpClient.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshSuccess = await this.handleTokenRefresh();
        
        if (refreshSuccess) {
          // Retry the original request with new token
          const newToken = getStoredToken();
          if (newToken) {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Authorization', `Bearer ${newToken}`);
            
            // Create new response with updated headers
            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
          }
        } else {
          // Refresh failed, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Authentication failed');
        }
      }

      return response;
    });

    // Error interceptor for logging
    httpClient.addErrorInterceptor(async (error) => {
      if (isDebugEnabled) {
        console.error('[API Service] Request failed:', error);
      }
      return error;
    });
  }

  /**
   * Handle token refresh with deduplication
   */
  private async handleTokenRefresh(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      return await refreshAccessToken();
    } catch (error) {
      if (isDebugEnabled) {
        console.error('[API Service] Token refresh failed:', error);
      }
      return false;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>, config?: RequestConfig): Promise<T> {
    try {
      const response = await httpClient.get<ApiResponse<T>>(endpoint, params, config);
      
      // httpClient already processes the response and returns the data directly
      return response.data as T;
    } catch (error: any) {
      console.error('API Service Error:', error.message);
      throw new Error(error.message || 'Failed to fetch data');
    }
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await httpClient.post<T>(endpoint, data, config);
      return response.data as T;
    } catch (error: any) {
      // Preserve the original error with all its details
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await httpClient.put<T>(endpoint, data, config);
      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update data');
    }
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    try {
      const response = await httpClient.patch<T>(endpoint, data, config);
      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update data');
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await httpClient.delete<T>(endpoint, config);
      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete data');
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile<T = any>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Don't set Content-Type manually - browser will set it with boundary
      const response = await httpClient.post<T>(endpoint, formData);
      return response.data as T;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  /**
   * Download file
   */
  async downloadFile(endpoint: string, filename?: string): Promise<void> {
    try {
      const response = await httpClient.get(endpoint, undefined, {
        headers: {
          'Accept': 'application/octet-stream',
        },
      });

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to download file');
    }
  }
}

export const apiService = new ApiService();
