import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'vehiclecare_auth_token';

export const setAuthToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  } else {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

export const getSetting = async (key: string, defaultValue: string = ''): Promise<string> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key) ?? defaultValue;
  } else {
    const val = await SecureStore.getItemAsync(key);
    return val ?? defaultValue;
  }
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

