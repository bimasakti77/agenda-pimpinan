/**
 * HTTP Client with advanced features
 * Implements retry logic, interceptors, and error handling
 */

import { apiConfig, isDebugEnabled } from '@/config/env';
import { 
  ApiResponse, 
  ApiError, 
  RequestConfig, 
  ApiRequestOptions, 
  RetryConfig, 
  ApiInterceptor 
} from '@/types/api';
import { getErrorMessage, logError } from '@/utils/errorHandler';

export class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private retryConfig: RetryConfig;
  private interceptors: ApiInterceptor[];
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.timeout = apiConfig.timeout;
    this.retryConfig = {
      attempts: apiConfig.retryAttempts,
      delay: apiConfig.retryDelay,
      backoff: 'exponential',
      retryCondition: this.shouldRetry,
    };
    this.interceptors = [];
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: ApiInterceptor['request']): void {
    this.interceptors.push({ request: interceptor });
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ApiInterceptor['response']): void {
    this.interceptors.push({ response: interceptor });
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ApiInterceptor['error']): void {
    this.interceptors.push({ error: interceptor });
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: ApiError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      error.statusCode >= 500 ||
      error.statusCode === 408 || // Request timeout
      error.statusCode === 429 || // Too many requests
      !error.statusCode // Network error
    );
  }

  /**
   * Calculate retry delay with backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const { delay, backoff } = this.retryConfig;
    
    if (backoff === 'exponential') {
      return delay * Math.pow(2, attempt - 1);
    }
    
    return delay * attempt;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let modifiedConfig = { ...config };

    for (const interceptor of this.interceptors) {
      if (interceptor.request) {
        modifiedConfig = await interceptor.request(modifiedConfig);
      }
    }

    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;

    for (const interceptor of this.interceptors) {
      if (interceptor.response) {
        modifiedResponse = await interceptor.response(modifiedResponse);
      }
    }

    return modifiedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: ApiError): Promise<ApiError> {
    let modifiedError = error;

    for (const interceptor of this.interceptors) {
      if (interceptor.error) {
        modifiedError = await interceptor.error(modifiedError);
      }
    }

    return modifiedError;
  }

  /**
   * Create AbortController with timeout
   */
  private createAbortController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    return controller;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params: Record<string, string | number | boolean>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    url: string, 
    options: RequestInit, 
    config: RequestConfig
  ): Promise<Response> {
    const { retries = 0, timeout: requestTimeout = this.timeout } = config;
    
    // Apply request interceptors
    const modifiedConfig = await this.applyRequestInterceptors(config);
    
    // Create abort controller for timeout
    const controller = this.createAbortController(requestTimeout);
    
    const requestOptions: RequestInit = {
      ...options,
      signal: config.signal || controller.signal,
      headers: {
        ...this.defaultHeaders,
        ...modifiedConfig.headers,
        ...options.headers,
      },
    };

    try {
      if (isDebugEnabled) {
        console.log(`[HTTP Client] ${options.method || 'GET'} ${url}`, {
          headers: requestOptions.headers,
          body: requestOptions.body,
        });
      }

      const response = await fetch(url, requestOptions);
      
      // Apply response interceptors
      const modifiedResponse = await this.applyResponseInterceptors(response);
      
      return modifiedResponse;
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.message || 'Network error',
        statusCode: 0,
        error: error.name || 'NetworkError',
        details: error,
      };

      // Apply error interceptors
      const modifiedError = await this.applyErrorInterceptors(apiError);

      // Retry logic
      if (retries > 0 && this.shouldRetry(modifiedError)) {
        const delay = this.calculateRetryDelay(this.retryConfig.attempts - retries + 1);
        
        if (isDebugEnabled) {
          console.log(`[HTTP Client] Retrying in ${delay}ms (${retries} attempts left)`);
        }
        
        await this.sleep(delay);
        return this.makeRequest(url, options, { ...config, retries: retries - 1 });
      }

      throw modifiedError;
    }
  }

  /**
   * Generic request method
   */
  async request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    const { method, endpoint, data, params, ...config } = options;
    
    // Build URL
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      url += this.buildQueryString(params);
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      const response = await this.makeRequest(url, requestOptions, config);
      
      // Handle different response types
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType?.includes('text/')) {
        responseData = await response.text();
      } else {
        responseData = await response.blob();
      }

      if (!response.ok) {
        const apiError: ApiError = {
          message: responseData?.message || `HTTP ${response.status}`,
          statusCode: response.status,
          error: responseData?.error || 'HTTP_ERROR',
          details: responseData,
        };
        
        // Log error with context
        logError(apiError, 'HTTP Client');
        
        throw apiError;
      }

      return {
        success: true,
        data: responseData?.data || responseData,
        message: responseData?.message,
        statusCode: response.status,
      };
    } catch (error: any) {
      if (isDebugEnabled) {
        console.error('[HTTP Client] Request failed:', error);
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string | number | boolean>, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      endpoint,
      params,
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      endpoint,
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      endpoint,
      data,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      endpoint,
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      endpoint,
      ...config,
    });
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
