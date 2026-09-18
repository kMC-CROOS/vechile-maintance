import React, { useEffect, useState } from 'react';
import {
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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { OtpInput } from '@/components/ui/OtpInput';
import { PasswordField } from '@/components/ui/PasswordField';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { Colors, FontSizes, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { isValidE164, maskE164 } from '@/utils/phone';

type Method = 'email' | 'phone';
type PhoneStep = 'request' | 'verify' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { forgotPassword } = useAuth();

  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('request');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleEmailSubmit = async () => {
    setEmailError('');
    setEmailSuccess('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailLoading(true);
    try {
      const msg = await forgotPassword(email.trim());
      setEmailSuccess(msg || 'If an account exists for this email, a password reset link has been sent.');
    } catch (err: any) {
      setEmailError(err.message || 'Unable to process reset request. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setPhoneError('');
    if (!phoneValid && !isValidE164(phone)) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneLoading(true);
    try {
      const res = await authService.requestPhoneOtp(phone);
      setPhoneStep('verify');
      setOtp('');
      setResendIn(45);
      Alert.alert('OTP sent', `OTP sent to ${maskE164(phone)}. ${res.message}`);
    } catch (err: any) {
      if (err.status === 429) {
        setPhoneError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setPhoneError(err.errors?.phone?.[0] || err.message || 'Unable to send OTP. Please try again.');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setPhoneError('');
    if (otp.length !== 6) {
      setPhoneError('Please enter the 6-digit code');
      return;
    }

    setPhoneLoading(true);
    try {
      const res = await authService.verifyPhoneOtp(phone, otp);
      setResetToken(res.reset_token);
      setPhoneStep('reset');
    } catch (err: any) {
      if (err.status === 429) {
        setPhoneError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setPhoneError(err.errors?.code?.[0] || err.message || 'Invalid or expired code');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setPhoneError('');
    if (password.length < 8) {
      setPhoneError('Password must contain at least 8 characters');
      return;
    }
    if (password !== passwordConfirmation) {
      setPhoneError('Passwords do not match');
      return;
    }

    setPhoneLoading(true);
    try {
      await authService.resetPasswordWithPhone({
        phone,
        token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace({ pathname: '/(auth)/login', params: { reset: '1' } } as any);
    } catch (err: any) {
      setPhoneError(err.errors?.password?.[0] || err.message || 'Unable to reset password. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Reset Password</Text>
          <Text style={styles.subTitle}>Choose email or phone to recover your account</Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, method === 'email' && styles.tabActive]}
              onPress={() => setMethod('email')}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>Reset via Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, method === 'phone' && styles.tabActive]}
              onPress={() => setMethod('phone')}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>Reset via Phone</Text>
            </TouchableOpacity>
          </View>

          {method === 'email' ? (
            <>
              <Text style={styles.helper}>Enter the email on your account. We’ll send reset instructions if it exists.</Text>
              {emailSuccess ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>✓ {emailSuccess}</Text>
                </View>
              ) : (
                <>
                  <Input
                    label="Registered Email"
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={emailError}
                  />
                  <Button title="Send Reset Link" onPress={handleEmailSubmit} loading={emailLoading} disabled={emailLoading} />
                </>
              )}
            </>
          ) : (
            <>
              {phoneStep === 'request' && (
                <>
                  <Text style={styles.helper}>
                    Enter the phone number on your account. If it’s registered, we’ll send a 6-digit code.
                  </Text>
                  <PhoneNumberInput
                    value={phone}
                    error={phoneError}
                    onChangePhone={(e164, meta) => {
                      setPhone(e164);
                      setPhoneValid(meta.isValid);
                      if (phoneError) setPhoneError('');
                    }}
                  />
                  <Button
                    title="Send OTP"
                    onPress={handleRequestOtp}
                    loading={phoneLoading}
                    disabled={phoneLoading}
                  />
                </>
              )}

              {phoneStep === 'verify' && (
                <>
                  <Text style={styles.helper}>OTP sent to {maskE164(phone)}. Enter the 6-digit code.</Text>
                  <OtpInput
                    value={otp}
                    onChange={(code) => {
                      setOtp(code);
                      if (phoneError) setPhoneError('');
                    }}
                    error={!!phoneError}
                  />
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  <Button
                    title="Verify code"
                    onPress={handleVerifyOtp}
                    loading={phoneLoading}
                    disabled={phoneLoading || otp.length !== 6}
                  />
                  <TouchableOpacity
                    style={styles.resendBtn}
                    disabled={resendIn > 0 || phoneLoading}
                    onPress={handleRequestOtp}
                    activeOpacity={0.7}>
                    <Text style={[styles.resendText, resendIn > 0 && styles.resendDisabled]}>
                      {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setPhoneStep('request')} activeOpacity={0.7}>
                    <Text style={styles.backLink}>Use a different number</Text>
                  </TouchableOpacity>
                </>
              )}

              {phoneStep === 'reset' && (
                <>
                  <Text style={styles.helper}>Choose a new password for your account.</Text>
                  <PasswordField
                    label="New Password"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <PasswordField
                    label="Confirm Password"
                    placeholder="••••••••"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    error={phoneError}
                  />
                  <Button
                    title="Update password"
                    onPress={handleResetPassword}
                    loading={phoneLoading}
                    disabled={phoneLoading}
                  />
                </>
              )}
            </>
          )}
        </Card>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} activeOpacity={0.7}>
            <Text style={styles.linkText}>Back to Sign In</Text>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: Radii.medium,
    padding: 4,
    marginBottom: Spacing.p16,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.small,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  helper: {
    fontSize: FontSizes.sm,
    color: Colors.textDim,
    lineHeight: 20,
    marginBottom: Spacing.p16,
  },
  successBanner: {
    backgroundColor: 'rgba(45, 212, 167, 0.12)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: Radii.medium,
    padding: Spacing.p16,
  },
  successBannerText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: -Spacing.p8,
    marginBottom: Spacing.p12,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: Spacing.p16,
    minHeight: 32,
    justifyContent: 'center',
  },
  resendText: {
    color: Colors.primaryBlue,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  resendDisabled: {
    color: Colors.textFaint,
  },
  backLink: {
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.p12,
    fontSize: FontSizes.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.p24,
  },
  linkText: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});
