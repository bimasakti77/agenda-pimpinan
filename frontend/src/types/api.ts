/**
 * API Types and Interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiRequestOptions extends RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  params?: Record<string, string | number | boolean>;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  retryCondition?: (error: ApiError) => boolean;
}

export interface ApiInterceptor {
  request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  response?: (response: Response) => Response | Promise<Response>;
  error?: (error: ApiError) => ApiError | Promise<ApiError>;
}

export interface ApiServiceConfig {
  baseUrl: string;
  timeout: number;
  retryConfig: RetryConfig;
  interceptors: ApiInterceptor[];
  defaultHeaders: Record<string, string>;
}
