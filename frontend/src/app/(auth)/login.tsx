import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function LoginScreen() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [googleError, setGoogleError] = useState('');
  const processedGoogleToken = useRef<string | null>(null);

  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
    webClientId: googleClientId,
  });

  useEffect(() => {
    const defaultRedirectUri = AuthSession.makeRedirectUri();
    console.log('[Google Auth] redirectUri is not passed explicitly; using expo-auth-session default');
    console.log('[Google Auth] AuthSession.makeRedirectUri()', defaultRedirectUri);
    console.log('[Google Auth] request.redirectUri', googleRequest?.redirectUri);
    if (typeof window !== 'undefined') {
      console.log('[Google Auth] window.location.origin', window.location.origin);
      console.log('[Google Auth] window.location.href', window.location.href);
    }
  }, [googleRequest]);

  const handleLogin = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      if (err.errors) {
        const formatted: Record<string, string> = {};
        Object.keys(err.errors).forEach((key) => {
          formatted[key] = err.errors[key][0];
        });
        setErrors(formatted);
      } else {
        Alert.alert('Sign In Failed', err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'success') {
      const idToken = googleResponse.params.id_token;
      if (!idToken) {
        setGoogleError('Google did not return an ID token. Please try again.');
        setGoogleLoading(false);
        return;
      }
      if (processedGoogleToken.current === idToken) {
        return;
      }
      processedGoogleToken.current = idToken;

      setGoogleLoading(true);
      googleLogin(idToken)
        .then(() => {
          router.replace('/');
        })
        .catch((err: any) => {
          const message = err.message || 'Could not authenticate with Google';
          setGoogleError(message);
          Alert.alert('Google Sign In Failed', message);
        })
        .finally(() => {
          setGoogleLoading(false);
        });
      return;
    }

    if (googleResponse.type === 'error') {
      const message = googleResponse.error?.message || 'Google sign-in failed. Please try again.';
      setGoogleError(message);
      Alert.alert('Google Sign In Failed', message);
      return;
    }

    if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') {
      setGoogleError('Google sign-in was cancelled.');
    }
  }, [googleLogin, googleResponse, router]);

  const handleGoogleLogin = async () => {
    setErrors({});
    setGoogleError('');

    if (!googleClientId) {
      const message = 'Google sign-in is not configured.';
      setGoogleError(message);
      Alert.alert('Google Sign In Failed', message);
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await promptGoogleAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setGoogleError('Google sign-in was cancelled.');
        setGoogleLoading(false);
      } else if (result.type === 'error') {
        const message = result.error?.message || 'Google sign-in failed. Please try again.';
        setGoogleError(message);
        Alert.alert('Google Sign In Failed', message);
        setGoogleLoading(false);
      }
      // success is handled in the response effect so the ID token is processed once
    } catch (err: any) {
      const message = err.message || 'Could not start Google sign-in';
      setGoogleError(message);
      Alert.alert('Google Sign In Failed', message);
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brandTitle}>VehicleCare</Text>
          <Text style={styles.subTitle}>Track your vehicle maintenance & costs effortlessly</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardHeader}>Sign In</Text>

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <PasswordField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notice', 'Password reset instructions have been sent to your email.')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.p12 }} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, (loading || googleLoading) && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}>
            {googleLoading ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.googleBtnText}>G  Continue with Google</Text>
            )}
          </TouchableOpacity>
          {googleError ? <Text style={styles.googleErrorText}>{googleError}</Text> : null}
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            style={styles.linkTouch}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.p32,
  },
  brandTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.p8,
  },
  card: {
    padding: Spacing.p24,
  },
  cardHeader: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.p20,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.p16,
    minHeight: 32,
    justifyContent: 'center',
  },
  forgotText: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.p20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textFaint,
    fontSize: FontSizes.xs,
    marginHorizontal: Spacing.p12,
  },
  googleBtn: {
    backgroundColor: Colors.surface2,
    borderRadius: Radii.medium,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  googleErrorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.p8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.p24,
  },
  footerText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
  },
  linkTouch: {
    minHeight: 32,
    justifyContent: 'center',
  },
  linkText: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
