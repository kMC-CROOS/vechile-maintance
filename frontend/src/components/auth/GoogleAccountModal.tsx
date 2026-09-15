import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Input } from '@/components/ui/Input';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';

interface GoogleAccountModalProps {
  visible: boolean;
  initialEmail?: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (email: string) => Promise<void>;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  visible,
  initialEmail = '',
  loading,
  onClose,
  onConfirm,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setEmail(initialEmail);
      setError('');
    }
  }, [visible, initialEmail]);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setError('Please enter a valid Google email address');
      return;
    }

    setError('');
    try {
      await onConfirm(trimmed);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header with Google Icon */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
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
            </View>
            <Text style={styles.title}>Sign in with Google</Text>
            <Text style={styles.subtitle}>
              Enter your Google Account email to authenticate and access your vehicle records.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Google Email Address"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={loading}
                activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.7}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 32, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.large,
    padding: Spacing.p24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.p20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.p12,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  form: {
    marginTop: Spacing.p8,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.p12,
    marginTop: Spacing.p16,
  },
  cancelBtn: {
    flex: 1,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.medium,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textDim,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  confirmBtn: {
    flex: 1,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.medium,
    backgroundColor: Colors.primaryBlue,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
});
