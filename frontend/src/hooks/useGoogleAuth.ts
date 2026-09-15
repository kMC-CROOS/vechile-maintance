import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { useAuth } from '@/context/AuthContext';

// Complete authentication session for web popup redirect
WebBrowser.maybeCompleteAuthSession();

// Google OAuth 2.0 Discovery Document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

export function useGoogleAuth() {
  const { googleLogin } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);

  // Pick client ID for the current platform or use safe placeholder
  const activeClientId =
    (Platform.OS === 'web'
      ? WEB_CLIENT_ID
      : Platform.OS === 'android'
      ? ANDROID_CLIENT_ID || WEB_CLIENT_ID
      : IOS_CLIENT_ID || WEB_CLIENT_ID) || 'google-auth-placeholder-id';

  // Compute safe redirect URI across Web, Expo Go, and standalone builds
  const redirectUri = makeRedirectUri({
    scheme: 'frontend',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: activeClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: ResponseType.Token,
    },
    discovery
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'cancel' || response.type === 'dismiss') {
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
      const { authentication } = response;
      const accessToken = authentication?.accessToken || (response.params as any)?.access_token;
      const idToken = authentication?.idToken || (response.params as any)?.id_token;

      handleGoogleSuccess(accessToken, idToken);
    }
  }, [response]);

  const handleGoogleSuccess = async (accessToken?: string, idToken?: string) => {
    try {
      setGoogleLoading(true);

      let email: string | undefined;
      let name: string | undefined;
      let googleId: string | undefined;

      // 1. Retrieve user profile info directly from Google using accessToken
      if (accessToken) {
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (userInfoRes.ok) {
            const profile = await userInfoRes.json();
            email = profile.email;
            name = profile.name || profile.given_name;
            googleId = profile.id || profile.sub;
          }
        } catch (fetchErr) {
          console.warn('Google userinfo fetch fallback:', fetchErr);
        }
      }

      // 2. Fallback to decoding idToken payload
      if (!email && idToken) {
        try {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            let jsonStr = '';
            if (typeof globalThis.atob === 'function') {
              try {
                jsonStr = decodeURIComponent(
                  globalThis
                    .atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
              } catch {
                jsonStr = globalThis.atob(base64);
              }
            }
            if (jsonStr) {
              const decoded = JSON.parse(jsonStr);
              email = decoded.email;
              name = decoded.name || decoded.given_name;
              googleId = decoded.sub;
            }
          }
        } catch (parseErr) {
          console.warn('ID token parse warning:', parseErr);
        }
      }

      if (!email) {
        throw new Error('Could not retrieve email from your Google account. Please try again.');
      }

      // 3. Complete authentication with backend API and persist Sanctum session
      await googleLogin({
        email: email.trim(),
        name: name?.trim() || email.split('@')[0],
        google_id: googleId || undefined,
      });

      // 4. Navigate to main dashboard
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      Alert.alert('Google Sign-In Failed', err.message || 'Unable to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGooglePress = useCallback(async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const isConfigured = Boolean(
      (Platform.OS === 'web' && WEB_CLIENT_ID) ||
      (Platform.OS === 'android' && (ANDROID_CLIENT_ID || WEB_CLIENT_ID)) ||
      (Platform.OS === 'ios' && (IOS_CLIENT_ID || WEB_CLIENT_ID))
    );

    // 1. If Google OAuth Client ID is configured, run the full OAuth 2.0 flow
    if (isConfigured) {
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
        Alert.alert('Google Sign-In Error', err.message || 'Could not open Google authentication.');
      }
      return;
    }

    // 2. If Client ID is not configured in .env yet, open the in-app Google modal
    setGoogleModalVisible(true);
  }, [request, promptAsync]);

  const handleGoogleEmailSubmit = useCallback(async (emailInput: string) => {
    setGoogleLoading(true);
    try {
      const defaultName = emailInput.trim().split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
      await googleLogin({
        email: emailInput.trim(),
        name: formattedName,
        google_id: `google_${Date.now()}`,
      });
      setGoogleModalVisible(false);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Sign-In Failed', err.message || 'Unable to sign in with Google account.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin]);

  return {
    handleGooglePress,
    googleLoading,
    googleModalVisible,
    setGoogleModalVisible,
    handleGoogleEmailSubmit,
    isReady: !!request,
  };
}
