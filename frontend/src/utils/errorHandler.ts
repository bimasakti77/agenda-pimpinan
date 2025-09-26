/**
 * Centralized Error Handler for Frontend
 * Handles different types of errors with appropriate user messages
 */

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

export interface ErrorMessages {
  [key: number]: string;
}

// Default error messages for different status codes
const DEFAULT_ERROR_MESSAGES: ErrorMessages = {
  400: 'Data yang dikirim tidak valid. Silakan periksa kembali.',
  401: 'Sesi telah berakhir. Silakan login kembali.',
  403: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
  404: 'Data yang diminta tidak ditemukan.',
  409: 'Data yang sama sudah ada. Silakan gunakan data yang berbeda.',
  422: 'Data tidak valid. Silakan periksa kembali.',
  429: 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
  500: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  502: 'Server sedang dalam pemeliharaan. Silakan coba lagi nanti.',
  503: 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
};

// Specific error messages for common scenarios
const SPECIFIC_ERROR_MESSAGES: { [key: string]: string } = {
  'Email and password are required': 'Email dan password harus diisi',
  'Start date and end date are required': 'Tanggal mulai dan tanggal akhir harus diisi',
  'Search query is required': 'Kata kunci pencarian harus diisi',
  'Date, start time, and end time are required': 'Tanggal, waktu mulai, dan waktu selesai harus diisi',
  'Duplicate entry. This value already exists.': 'Data yang sama sudah ada. Silakan gunakan data yang berbeda.',
  'Required field is missing.': 'Field yang wajib diisi masih kosong.',
  'Referenced resource does not exist.': 'Data yang dirujuk tidak ditemukan.',
  'Invalid token': 'Token tidak valid. Silakan login kembali.',
  'Token expired': 'Sesi telah berakhir. Silakan login kembali.',
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: ApiError | any): string {
  // If it's already a user-friendly message, return as is
  if (typeof error === 'string') {
    return error;
  }

  // If error has a specific message, try to translate it
  if (error?.message) {
    const specificMessage = SPECIFIC_ERROR_MESSAGES[error.message];
    if (specificMessage) {
      return specificMessage;
    }
    
    // If message is already in Indonesian, return as is
    if (error.message.includes('harus') || error.message.includes('tidak') || error.message.includes('silakan')) {
      return error.message;
    }
  }

  // Get message based on status code
  const statusCode = error?.statusCode || error?.status || 500;
  const defaultMessage = DEFAULT_ERROR_MESSAGES[statusCode] || DEFAULT_ERROR_MESSAGES[500];

  // If we have a specific error message, combine it with default
  if (error?.message && !SPECIFIC_ERROR_MESSAGES[error.message]) {
    return `${defaultMessage} (${error.message})`;
  }

  return defaultMessage;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: ApiError | any): boolean {
  return error?.statusCode === 400 || error?.status === 400;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: ApiError | any): boolean {
  return error?.statusCode === 401 || error?.status === 401;
}

/**
 * Check if error is a permission error (403)
 */
export function isPermissionError(error: ApiError | any): boolean {
  return error?.statusCode === 403 || error?.status === 403;
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: ApiError | any): boolean {
  return error?.statusCode === 404 || error?.status === 404;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: ApiError | any): boolean {
  const statusCode = error?.statusCode || error?.status || 500;
  return statusCode >= 500;
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: ApiError | any): 'low' | 'medium' | 'high' {
  const statusCode = error?.statusCode || error?.status || 500;
  
  if (statusCode >= 500) return 'high';
  if (statusCode >= 400) return 'medium';
  return 'low';
}

/**
 * Log error with appropriate level
 */
export function logError(error: ApiError | any, context?: string): void {
  const severity = getErrorSeverity(error);
  const message = getErrorMessage(error);
  
  // Skip logging for client errors (4xx) that are handled by UI
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return;
  }
  
  const logMessage = context 
    ? `[${context}] ${message}` 
    : message;
  
  switch (severity) {
    case 'high':
      console.error('🚨 HIGH SEVERITY ERROR:', logMessage, error);
      break;
    case 'medium':
      console.warn('⚠️ MEDIUM SEVERITY ERROR:', logMessage, error);
      break;
    case 'low':
      console.info('ℹ️ LOW SEVERITY ERROR:', logMessage, error);
      break;
  }
}
