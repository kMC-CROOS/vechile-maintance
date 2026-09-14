import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { apiFetch, setOnUnauthorizedHandler } from '@/services/api';
import { getAuthToken, removeAuthToken, setAuthToken } from '@/services/storage';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (data: { email: string; name?: string; google_id?: string }) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadUser = async () => {
    try {
      const storedToken = await getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        const data = await apiFetch<{ user: User }>('/me');
        setUser(data.user);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
      await removeAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOnUnauthorizedHandler(() => {
      setUser(null);
      setToken(null);
      router.replace('/(auth)/login' as any);
    });
    reloadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ user: User; token: string }>('/login', {
      method: 'POST',
      body: { email, password },
    });
    await setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await apiFetch<{ user: User; token: string }>('/register', {
      method: 'POST',
      body: data,
    });
    await setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const googleLogin = async (data: { email: string; name?: string; google_id?: string }) => {
    const res = await apiFetch<{ user: User; token: string }>('/google-auth', {
      method: 'POST',
      body: data,
    });
    await setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    await removeAuthToken();
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login' as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        googleLogin,
        logout,
        reloadUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
