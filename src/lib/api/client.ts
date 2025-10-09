import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * API Client Configuration
 *
 * Axios instance with JWT authentication and error handling
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://sms-agent-api.up.railway.app';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request interceptor - Add JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle auth errors and token expiration
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

/**
 * API Error Response Type
 */
export interface ApiError {
  success: false;
  error: string;
}

/**
 * API Success Response Type
 */
export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Helper function to extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError;
    return data?.error || error.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}