import { getStoredToken, refreshAccessToken } from '@/lib/auth';

class ApiService {
  private baseURL = 'http://localhost:3000/api';

  private async request(endpoint: string, options: RequestInit = {}) {
    console.log('API Request URL:', `${this.baseURL}${endpoint}`);
    const token = getStoredToken();
    
    if (!token) {
      window.location.href = '/login';
      throw new Error('No authentication token');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshSuccess = await refreshAccessToken();
      if (refreshSuccess) {
        const newToken = getStoredToken();
        return fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const response = await this.request(endpoint);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch data');
    }
    const result = await response.json();
    return result.data || result;
  }

  async post<T = any>(endpoint: string, data: any): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create data');
    }
    
    const result = await response.json();
    return result.data || result;
  }

  async put<T = any>(endpoint: string, data: any): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update data');
    }
    
    const result = await response.json();
    return result.data || result;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.request(endpoint, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete data');
    }
    
    const result = await response.json();
    return result.data || result;
  }
}

export const apiService = new ApiService();
