import { apiFetch } from '@/services/api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
  vehicles_count?: number;
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

  async requestPhoneOtp(phone: string): Promise<{ message: string; status: string }> {
    return await apiFetch<{ message: string; status: string }>('/forgot-password/phone/request', {
      method: 'POST',
      body: { phone },
    });
  },

  async verifyPhoneOtp(phone: string, code: string): Promise<{ message: string; reset_token: string }> {
    return await apiFetch<{ message: string; reset_token: string }>('/forgot-password/phone/verify', {
      method: 'POST',
      body: { phone, code },
    });
  },

  async resetPasswordWithPhone(data: {
    phone: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string; status: string }> {
    return await apiFetch<{ message: string; status: string }>('/forgot-password/phone/reset', {
      method: 'POST',
      body: data,
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
