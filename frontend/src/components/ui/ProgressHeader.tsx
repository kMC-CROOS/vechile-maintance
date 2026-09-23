import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

export interface ProgressHeaderProps {
  currentStep: number; // 1 to 4
  totalSteps?: number;
  stepName?: string;
}

const STEPS = ['Vehicle', 'Details', 'Documents', 'Review'];

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  currentStep,
  totalSteps = 4,
  stepName,
}) => {
  const progressPercent = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);
  const activeStepLabel = stepName || STEPS[currentStep - 1] || 'Details';

  return (
    <View style={styles.container}>
      {/* Top Text Row */}
      <View style={styles.textRow}>
        <View style={styles.leftLabel}>
          <Text style={styles.stepBadgeText}>STEP {currentStep} OF {totalSteps}</Text>
          <Text style={styles.stepTitleText}>{activeStepLabel}</Text>
        </View>
        <Text style={styles.percentText}>{Math.round(progressPercent)}% complete</Text>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Step Dots indicator */}
      <View style={styles.dotsRow}>
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <View key={label} style={styles.dotItem}>
              <View
                style={[
                  styles.dotCircle,
                  isCompleted && styles.dotCircleCompleted,
                  isActive && styles.dotCircleActive,
                ]}>
                {isCompleted ? (
                  <Text style={styles.dotCheck}>✓</Text>
                ) : (
                  <Text style={[styles.dotNumber, isActive && styles.dotNumberActive]}>
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text style={[styles.dotLabel, (isActive || isCompleted) && styles.dotLabelActive]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF2',
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  leftLabel: {
    gap: 2,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCircleActive: {
    backgroundColor: '#2563EB',
  },
  dotCircleCompleted: {
    backgroundColor: '#16A34A',
  },
  dotNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  dotNumberActive: {
    color: '#FFFFFF',
  },
  dotCheck: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dotLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
});
