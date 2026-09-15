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
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { GoogleAccountModal } from '@/components/auth/GoogleAccountModal';

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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const {
    handleGooglePress,
    googleLoading,
    googleModalVisible,
    setGoogleModalVisible,
    handleGoogleEmailSubmit,
  } = useGoogleAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: Colors.border };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 12) score += 1;

    if (score <= 1) {
      return { score: 1, label: 'Weak', color: Colors.error };
    } else if (score === 2 || score === 3) {
      return { score: 2, label: 'Medium', color: Colors.warning };
    } else {
      return { score: 3, label: 'Strong', color: Colors.success };
    }
  };

  const strength = getPasswordStrength(password);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password must contain at least 8 characters';
    } else if (password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters';
    }

    if (!passwordConfirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (password !== passwordConfirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      // Navigate directly to Home/Dashboard
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      if (err.errors) {
        const formatted: Record<string, string> = {};
        Object.keys(err.errors).forEach((key) => {
          let msg = err.errors[key][0];
          if (key === 'email' && (msg.includes('taken') || msg.includes('registered') || msg.includes('unique'))) {
            msg = 'This email address is already registered. Please sign in instead.';
          }
          formatted[key] = msg;
        });
        setErrors(formatted);
      } else {
        const fallbackMsg =
          err.message?.includes('registered') || err.message?.includes('taken')
            ? 'This email address is already registered. Please sign in instead.'
            : err.message || 'Unable to create account. Please try again.';
        Alert.alert('Registration Failed', fallbackMsg);
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
        <View style={styles.header}>
          <Text style={styles.brandTitle}>VehicleCare</Text>
          <Text style={styles.subTitle}>Create an account to start tracking your vehicle</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardHeader}>Create Account</Text>

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={(val) => {
              setName(val);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            autoCapitalize="words"
            autoCorrect={false}
          />

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

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.meterRow}>
                <View
                  style={[
                    styles.meterBar,
                    {
                      backgroundColor:
                        strength.score >= 1 ? strength.color : Colors.surface2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.meterBar,
                    {
                      backgroundColor:
                        strength.score >= 2 ? strength.color : Colors.surface2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.meterBar,
                    {
                      backgroundColor:
                        strength.score >= 3 ? strength.color : Colors.surface2,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: strength.color }]}>
                Password Strength: {strength.label}
              </Text>
            </View>
          )}

          <PasswordField
            label="Confirm Password"
            placeholder="••••••••"
            value={passwordConfirmation}
            onChangeText={(val) => {
              setPasswordConfirmation(val);
              if (errors.password_confirmation) {
                setErrors((prev) => ({ ...prev, password_confirmation: '' }));
              }
            }}
            error={errors.password_confirmation}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            disabled={loading || googleLoading}
            style={{ marginTop: Spacing.p16 }}
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
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            style={styles.linkTouch}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.linkText}>Sign In</Text>
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
    marginBottom: Spacing.p24,
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
  strengthContainer: {
    marginTop: -Spacing.p8,
    marginBottom: Spacing.p16,
  },
  meterRow: {
    flexDirection: 'row',
    gap: 6,
    height: 4,
    width: '100%',
  },
  meterBar: {
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: 6,
    paddingLeft: Spacing.p4,
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

