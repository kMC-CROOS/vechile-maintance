import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { navigatePostAuth } from '@/utils/postAuthNavigation';

// Complete authentication session for web popup redirect
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '';

export function useGoogleAuth() {
  const { googleLogin } = useAuth();
  const { reloadVehicles } = useVehicle();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_CLIENT_ID,
  });

  const handleGoogleSuccess = useCallback(
    async (idToken: string) => {
      try {
        setGoogleLoading(true);

        // Exchange Google id_token with backend POST /api/google-auth
        await googleLogin(idToken);

        // Check vehicle count and navigate accordingly
        const userVehicles = await reloadVehicles();
        navigatePostAuth(userVehicles.length);
      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        Alert.alert(
          'Google Sign-In Failed',
          err.message || 'Unable to sign in with Google. Please try again.'
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    [googleLogin, reloadVehicles]
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'cancel' || response.type === 'dismiss') {
      // Graceful cancel: reset loading state without crash or error dialog
      setGoogleLoading(false);
      return;
    }

    if (response.type === 'error') {
      setGoogleLoading(false);
      Alert.alert(
        'Google Sign-In Error',
        response.error?.message || 'Authentication could not be completed.'
      );
      return;
    }

    if (response.type === 'success') {
      const idToken =
        response.params?.id_token ||
        (response.authentication as any)?.idToken;

      if (!idToken) {
        setGoogleLoading(false);
        Alert.alert(
          'Google Sign-In Failed',
          'No ID token received from Google. Please try again.'
        );
        return;
      }

      handleGoogleSuccess(idToken);
    }
  }, [response, handleGoogleSuccess]);

  const handleGooglePress = useCallback(
    async (e?: any) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      if (!GOOGLE_CLIENT_ID) {
        Alert.alert(
          'Configuration Error',
          'Google Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.'
        );
        return;
      }

      if (!request) {
        Alert.alert('Initializing', 'Google Sign-In is initializing. Please try again in a moment.');
        return;
      }

      setGoogleLoading(true);
      try {
        const result = await promptAsync();
        if (result.type === 'cancel' || result.type === 'dismiss') {
          setGoogleLoading(false);
        }
      } catch (err: any) {
        setGoogleLoading(false);
        Alert.alert(
          'Google Sign-In Error',
          err.message || 'Could not open Google authentication.'
        );
      }
    },
    [request, promptAsync]
  );

  const handleGoogleEmailSubmit = useCallback(async (_emailInput: string) => {
    setGoogleModalVisible(false);
  }, []);

  return {
    handleGooglePress,
    googleLoading,
    googleModalVisible,
    setGoogleModalVisible,
    handleGoogleEmailSubmit,
    isReady: !!request,
  };
}
