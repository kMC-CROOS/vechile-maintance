import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';

export const DashboardSkeleton: React.FC = () => {
  const { isDark, theme } = useAppTheme();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const pulseBg = isDark ? '#334155' : '#E2E8F0';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderCol = isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* 1. Vehicle Overview Card Skeleton */}
      <View style={[styles.overviewSkeleton, { backgroundColor: pulseBg }]} />

      {/* 2. Quick Actions Skeleton */}
      <View style={styles.actionsSkeletonRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.actionItemSkeleton}>
            <View style={[styles.actionCircleSkeleton, { backgroundColor: pulseBg }]} />
            <View style={[styles.actionTextSkeleton, { backgroundColor: pulseBg }]} />
          </View>
        ))}
      </View>

      {/* 3. Alert Banner Skeleton */}
      <View style={[styles.alertSkeleton, { backgroundColor: isDark ? '#2D230A' : '#FEF3C7', borderColor: borderCol }]}>
        <View style={[styles.alertCircleSkeleton, { backgroundColor: pulseBg }]} />
        <View style={styles.alertContentSkeleton}>
          <View style={[styles.alertLineShort, { backgroundColor: pulseBg }]} />
          <View style={[styles.alertLineLong, { backgroundColor: pulseBg }]} />
        </View>
      </View>

      {/* 4. Status Grid (2x2) Skeleton */}
      <View style={styles.gridHeaderSkeleton}>
        <View style={[styles.titleSkeleton, { backgroundColor: pulseBg }]} />
      </View>
      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.gridCardSkeleton, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.badgeSkeleton, { backgroundColor: pulseBg }]} />
            <View style={[styles.labelSkeleton, { backgroundColor: pulseBg }]} />
            <View style={[styles.valueSkeleton, { backgroundColor: pulseBg }]} />
            <View style={[styles.subSkeleton, { backgroundColor: pulseBg }]} />
          </View>
        ))}
      </View>

      {/* 5. Financial Summary Skeleton */}
      <View style={styles.gridHeaderSkeleton}>
        <View style={[styles.titleSkeleton, { backgroundColor: pulseBg }]} />
      </View>
      <View style={styles.financialRow}>
        {[1, 2].map((i) => (
          <View key={i} style={[styles.financeCardSkeleton, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.labelSkeleton, { backgroundColor: pulseBg }]} />
            <View style={[styles.valueSkeleton, { backgroundColor: pulseBg, width: '70%', height: 22 }]} />
            <View style={[styles.subSkeleton, { backgroundColor: pulseBg, width: '50%' }]} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  overviewSkeleton: {
    height: 148,
    borderRadius: 18,
    marginBottom: 18,
  },
  actionsSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  actionItemSkeleton: {
    alignItems: 'center',
    width: 80,
  },
  actionCircleSkeleton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  actionTextSkeleton: {
    width: 54,
    height: 10,
    borderRadius: 5,
  },
  alertSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  alertCircleSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  alertContentSkeleton: {
    flex: 1,
    gap: 6,
  },
  alertLineShort: {
    width: '45%',
    height: 12,
    borderRadius: 6,
  },
  alertLineLong: {
    width: '75%',
    height: 10,
    borderRadius: 5,
  },
  gridHeaderSkeleton: {
    marginTop: 4,
    marginBottom: 10,
  },
  titleSkeleton: {
    width: 130,
    height: 14,
    borderRadius: 7,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  gridCardSkeleton: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    height: 110,
    justifyContent: 'space-between',
  },
  badgeSkeleton: {
    width: 60,
    height: 14,
    borderRadius: 6,
  },
  labelSkeleton: {
    width: '55%',
    height: 10,
    borderRadius: 5,
  },
  valueSkeleton: {
    width: '80%',
    height: 16,
    borderRadius: 6,
  },
  subSkeleton: {
    width: '65%',
    height: 9,
    borderRadius: 4,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  financeCardSkeleton: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    height: 95,
    justifyContent: 'space-between',
  },
});
