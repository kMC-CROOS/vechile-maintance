import { apiFetch } from '@/services/api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export interface GoogleAuthPayload {
  email?: string;
  name?: string;
  google_id?: string;
  id_token?: string;
}

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return await apiFetch<AuthResponse>('/login', {
      method: 'POST',
      body: { email: email.trim(), password },
    });
  },

  /**
   * Register a new user
   */
  async register(data: RegisterPayload): Promise<AuthResponse> {
    return await apiFetch<AuthResponse>('/register', {
      method: 'POST',
      body: {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
        password_confirmation: data.password_confirmation,
      },
    });
  },

  /**
   * Google authentication (OAuth identity exchange)
   */
  async googleAuth(data: GoogleAuthPayload): Promise<AuthResponse> {
    return await apiFetch<AuthResponse>('/google-auth', {
      method: 'POST',
      body: {
        id_token: data.id_token,
        email: data.email ? data.email.trim() : undefined,
        name: data.name?.trim() || undefined,
        google_id: data.google_id,
      },
    });
  },

  /**
   * Request password reset link
   */
  async forgotPassword(email: string): Promise<{ message: string; status: string }> {
    return await apiFetch<{ message: string; status: string }>('/forgot-password', {
      method: 'POST',
      body: { email: email.trim() },
    });
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe(): Promise<{ user: UserProfile }> {
    return await apiFetch<{ user: UserProfile }>('/me', {
      method: 'GET',
    });
  },

  /**
   * Update authenticated user profile
   */
  async updateProfile(data: { name: string; phone?: string }): Promise<{ user: UserProfile; message: string }> {
    return await apiFetch<{ user: UserProfile; message: string }>('/me', {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Revoke current token on backend
   */
  async logout(): Promise<void> {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    }
  },
};
