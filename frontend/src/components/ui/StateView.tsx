import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { Button } from './Button';

interface StateViewProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionTitle?: string;
  children?: React.ReactNode;
}

export const StateView: React.FC<StateViewProps> = ({
  loading,
  error,
  empty,
  emptyTitle = 'No data available',
  emptyMessage = 'There are no records to display.',
  onRetry,
  onAction,
  actionTitle = 'Add New',
  children,
}) => {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primaryBlue} />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <Button title="Try Again" variant="outline" onPress={onRetry} style={{ marginTop: Spacing.p16 }} />
        )}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        {onAction && (
          <Button title={actionTitle} variant="primary" onPress={onAction} style={{ marginTop: Spacing.p16 }} />
        )}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    padding: Spacing.p32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.p12,
    color: Colors.textDim,
    fontSize: FontSizes.sm,
  },
  errorTitle: {
    color: Colors.error,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.p8,
  },
  errorText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing.p8,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
});
