import { API_BASE_URL } from '@/constants/api';
import { getAuthToken, removeAuthToken } from '@/services/storage';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedHandler = (handler: () => void) => {
  onUnauthorizedCallback = handler;
};

export const apiFetch = async <T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    isFormData?: boolean;
    headers?: Record<string, string>;
  } = {}
): Promise<T> => {
  const { method = 'GET', body, isFormData = false, headers: customHeaders = {} } = options;

  const token = await getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody = body;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    });

    if (response.status === 401) {
      await removeAuthToken();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      throw { message: 'Unauthorized. Please sign in again.', status: 401 } as ApiError;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error: ApiError = {
        message: data?.message || `Request failed with status ${response.status}`,
        errors: data?.errors,
        status: response.status,
      };
      throw error;
    }

    return data as T;
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    throw {
      message: err.message || 'Network error. Please check your internet connection.',
      status: 0,
    } as ApiError;
  }
};
