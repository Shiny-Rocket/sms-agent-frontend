import { apiClient, ApiSuccess } from './client';

/**
 * Authentication API
 */

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Login user
 * POST /api/v1/auth/login
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiSuccess<AuthResponse>>(
    '/auth/login',
    credentials
  );

  // Store token and user in localStorage
  if (data.success && data.data) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  }

  throw new Error('Login failed');
}

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export async function register(
  userData: RegisterRequest
): Promise<AuthResponse> {
  const { data } = await apiClient.post<ApiSuccess<AuthResponse>>(
    '/auth/register',
    userData
  );

  // Store token and user in localStorage
  if (data.success && data.data) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  }

  throw new Error('Registration failed');
}

/**
 * Get current user profile
 * GET /api/v1/logged-in/profile
 */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<ApiSuccess<User>>('/logged-in/profile');

  if (data.success && data.data) {
    return data.data;
  }

  throw new Error('Failed to get user profile');
}

/**
 * Logout user (client-side only)
 */
export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}
