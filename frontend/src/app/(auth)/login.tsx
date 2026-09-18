import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { AutomotiveHeroAnimation } from '@/components/auth/AutomotiveHeroAnimation';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { GoogleAccountModal } from '@/components/auth/GoogleAccountModal';
import { navigatePostAuth } from '@/utils/postAuthNavigation';

// Google SVG "G" Icon
const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const { login } = useAuth();
  const { reloadVehicles } = useVehicle();
  const {
    handleGooglePress,
    googleLoading,
    googleModalVisible,
    setGoogleModalVisible,
    handleGoogleEmailSubmit,
  } = useGoogleAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSuccess, setResetSuccess] = useState(reset === '1');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      const userVehicles = await reloadVehicles();
      navigatePostAuth(userVehicles.length);
    } catch (err: any) {
      if (err.errors) {
        const formatted: Record<string, string> = {};
        Object.keys(err.errors).forEach((key) => {
          formatted[key] = err.errors[key][0];
        });
        setErrors(formatted);
      } else {
        const message = err.message || 'Invalid email or password.';
        Alert.alert('Sign In Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>VehicleCare</Text>
          <Text style={styles.brandTagline}>SMART FLEET & VEHICLE TELEMETRY</Text>
        </View>

        {/* Premium Cinematic Automotive Hero Animation */}
        <AutomotiveHeroAnimation />

        {/* Motoring Slogan */}
        <View style={styles.sloganContainer}>
          <Text style={styles.sloganTitle}>YOUR VEHICLE. ALWAYS READY.</Text>
          <Text style={styles.subTitle}>Sign in to manage maintenance, logs & telemetry</Text>
        </View>

        {/* Login Form Card */}
        <Card style={styles.card}>
          <Text style={styles.cardHeader}>Sign In</Text>
          {resetSuccess ? (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>✓ Password updated. You can now sign in.</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />

          <PasswordField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            activeOpacity={0.7}
            onPress={() => {
              setResetSuccess(false);
              router.push({
                pathname: '/(auth)/forgot-password',
                params: email.trim() ? { email: email.trim() } : {},
              } as any);
            }}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || googleLoading}
            style={{ marginTop: Spacing.p8 }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, (loading || googleLoading) && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleGooglePress}
            disabled={loading || googleLoading}>
            {googleLoading ? (
              <ActivityIndicator color={Colors.textPrimary} size="small" />
            ) : (
              <View style={styles.googleBtnContent}>
                <GoogleIcon />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
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

      {/* Google Account Modal (Used when OAuth client ID is not configured in .env) */}
      <GoogleAccountModal
        visible={googleModalVisible}
        initialEmail={email}
        loading={googleLoading}
        onClose={() => setGoogleModalVisible(false)}
        onConfirm={handleGoogleEmailSubmit}
      />
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
    paddingVertical: Spacing.p32,
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
  brandTagline: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 1.5,
    marginTop: 3,
  },
  sloganContainer: {
    alignItems: 'center',
    marginBottom: Spacing.p16,
    paddingHorizontal: Spacing.screenPadding,
  },
  sloganTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.p4,
  },
  card: {
    padding: Spacing.p24,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
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
    fontWeight: '600',
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
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  successBanner: {
    backgroundColor: 'rgba(45, 212, 167, 0.12)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: Radii.medium,
    padding: Spacing.p16,
    marginVertical: Spacing.p12,
  },
  successBannerText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontWeight: '600',
  },
});

