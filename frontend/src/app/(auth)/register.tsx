import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors, FontSizes, MinTouchTarget, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';
    if (password !== passwordConfirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    if (!acceptedTerms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace('/');
    } catch (err: any) {
      if (err.errors) {
        const formatted: Record<string, string> = {};
        Object.keys(err.errors).forEach((key) => {
          formatted[key] = err.errors[key][0];
        });
        setErrors(formatted);
      } else {
        Alert.alert('Registration Failed', err.message || 'Error creating account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            onChangeText={setName}
            error={errors.name}
          />

          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="+94 77 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            error={errors.password_confirmation}
          />

          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.7}
            onPress={() => setAcceptedTerms(!acceptedTerms)}>
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms of Service & Privacy Policy
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: Spacing.p16 }}
          />
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            style={styles.linkTouch}
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.linkText}>Sign in</Text>
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
    marginBottom: Spacing.p24,
  },
  brandTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.p4,
  },
  card: {
    padding: Spacing.p24,
  },
  cardHeader: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.p16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.p8,
    minHeight: MinTouchTarget,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.p12,
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  checkmark: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  termsText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.p8,
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
