import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { setOnUnauthorizedHandler } from '@/services/api';
import {
  authService,
  GoogleAuthPayload,
  RegisterPayload,
  UserProfile,
} from '@/services/authService';
import { getAuthToken, removeAuthToken, setAuthToken } from '@/services/storage';

import { dataCache } from '@/services/dataCache';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  googleLogin: (data: string | GoogleAuthPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  updateProfile: (data: { name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const clearSessionData = () => {
  dataCache.clear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove = [
        'vehiclecare_documents_records',
        'vehiclecare_service_records_list',
        'vehiclecare_fuel_logs_list',
        'vehiclecare_expenses_list',
        'vehiclecare_alert_preferences',
      ];
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {}
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadUser = async () => {
    try {
      const storedToken = await getAuthToken();
      if (storedToken) {
        setToken(storedToken);
        const data = await authService.getMe();
        setUser(data.user);
      } else {
        clearSessionData();
        setUser(null);
        setToken(null);
      }
    } catch {
      clearSessionData();
      setUser(null);
      setToken(null);
      await removeAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOnUnauthorizedHandler(() => {
      clearSessionData();
      setUser(null);
      setToken(null);
      router.replace('/(auth)/login' as any);
    });
    reloadUser();
  }, []);

  const login = async (email: string, password: string) => {
    clearSessionData();
    const res = await authService.login(email, password);
    await setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: RegisterPayload) => {
    clearSessionData();
    const res = await authService.register(data);
    await setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const googleLogin = useCallback(async (data: string | GoogleAuthPayload) => {
    clearSessionData();
    const payload: GoogleAuthPayload = typeof data === 'string' ? { id_token: data } : data;
    const res = await authService.googleAuth(payload);
    await setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await authService.forgotPassword(email);
    return res.message;
  };

  const updateProfile = async (data: { name: string; phone?: string }) => {
    const res = await authService.updateProfile(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    clearSessionData();
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
        forgotPassword,
        updateProfile,
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

