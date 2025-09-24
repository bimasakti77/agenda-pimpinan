/**
 * API Endpoints Configuration
 * Centralized endpoint definitions for the application
 */

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // User endpoints
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    GET_BY_ID: (id: number) => `/users/${id}`,
    UPDATE: (id: number) => `/users/${id}`,
    DELETE: (id: number) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  // Agenda endpoints
  AGENDA: {
    LIST: '/agenda',
    CREATE: '/agenda',
    GET_BY_ID: (id: number) => `/agenda/${id}`,
    UPDATE: (id: number) => `/agenda/${id}`,
    DELETE: (id: number) => `/agenda/${id}`,
    UPDATE_STATUS: (id: number) => `/agenda/${id}/status`,
    GET_BY_USER: (userId: number) => `/agenda/user/${userId}`,
    GET_BY_DATE: (date: string) => `/agenda/date/${date}`,
    GET_BY_DATE_RANGE: (startDate: string, endDate: string) => 
      `/agenda/date-range?start=${startDate}&end=${endDate}`,
  },

  // File upload endpoints
  UPLOAD: {
    AVATAR: '/upload/avatar',
    DOCUMENT: '/upload/document',
    IMAGE: '/upload/image',
  },

  // Report endpoints
  REPORTS: {
    AGENDA_SUMMARY: '/reports/agenda-summary',
    USER_ACTIVITY: '/reports/user-activity',
    EXPORT_AGENDA: '/reports/export-agenda',
  },

  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_AGENDA: '/dashboard/recent-agenda',
    UPCOMING_AGENDA: '/dashboard/upcoming-agenda',
  },
} as const;

/**
 * Helper function to build query parameters
 */
export function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Helper function to build endpoint with query parameters
 */
export function buildEndpoint(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const queryString = buildQueryParams(params);
  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

export default API_ENDPOINTS;
