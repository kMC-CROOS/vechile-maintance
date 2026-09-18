import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AnimatedCountText } from '@/components/ui/AnimatedCountText';
import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/services/api';
import { DataCache, dataCache } from '@/services/dataCache';

interface AlertItem {
  id?: string | number;
  title: string;
  category: string;
  daysLeft?: number;
  dueDate?: string;
  dueInfo?: string;
}

interface StatusGridProps {
  activeVehicle?: {
    id?: string | number;
    user_id?: number;
    name?: string;
    odometer?: number;
    current_odometer?: number;
    insurance?: { expiryDate?: string; provider?: string };
    warranty?: { expiryDate?: string };
    tax_record?: { valid_until?: string };
    puc?: { expiryDate?: string };
  };
  onAnalyticsPress?: () => void;
  onAlertPress?: () => void;
  onNextServicePress?: () => void;
  onInsurancePress?: () => void;
  onPucPress?: () => void;
  refreshTrigger?: number;
}

const WarningIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86L1.82 18A2 2 0 0 0 3.55 21H20.45A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z"
      stroke="#D97706"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9V13M12 17H12.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const StatusGrid: React.FC<StatusGridProps> = ({
  activeVehicle,
  onAnalyticsPress,
  onAlertPress,
  onNextServicePress,
  onInsurancePress,
  onPucPress,
  refreshTrigger = 0,
}) => {
  const { user } = useAuth();
  const { isDark, theme } = useAppTheme();

  // Active Alert Carousel Index
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  // Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Next Service State
  const [nextServiceInfo, setNextServiceInfo] = useState<{
    isSet: boolean;
    dueOdometer?: number;
    remainingKm?: number;
    dueDate?: string;
    recommendedKm: number;
  }>({
    isSet: false,
    recommendedKm: 4500,
  });

  // Insurance Expiry State
  const [insuranceInfo, setInsuranceInfo] = useState<{
    isSet: boolean;
    dueDate?: string;
    daysLeft?: number;
    provider?: string;
  }>({
    isSet: false,
  });

  // PUC Expiry State
  const [pucInfo, setPucInfo] = useState<{
    isSet: boolean;
    dueDate?: string;
    daysLeft?: number;
  }>({
    isSet: false,
  });

  // Avg Mileage State
  const [avgMileage, setAvgMileage] = useState<string>('N/A');

  // Financial Stats
  const [financialStats, setFinancialStats] = useState<{
    totalExpenses: number;
    fuelThisMonth: number;
  }>({
    totalExpenses: 0,
    fuelThisMonth: 0,
  });

  // Primary data fetcher from backend API with strictly user-scoped cache
  useEffect(() => {
    let isCancelled = false;

    const fetchDashboardData = async () => {
      if (!user?.id || !activeVehicle?.id) {
        // Reset to clean empty states when no vehicle or no user
        setAlerts([]);
        setNextServiceInfo({ isSet: false, recommendedKm: 4500 });
        setInsuranceInfo({ isSet: false });
        setPucInfo({ isSet: false });
        setAvgMileage('N/A');
        setFinancialStats({ totalExpenses: 0, fuelThisMonth: 0 });
        return;
      }

      const cacheKey = DataCache.scopedKey(user.id, activeVehicle.id, 'dashboard');
      const force = Boolean(refreshTrigger && refreshTrigger > 0);

      if (!force) {
        const cached = dataCache.get<any>(cacheKey, 30000);
        if (cached && !isCancelled) {
          applyDashboardData(cached);
          return;
        }
      }

      try {
        const data = await apiFetch(`/vehicles/${activeVehicle.id}/dashboard`);
        if (!isCancelled && data) {
          dataCache.set(cacheKey, data);
          applyDashboardData(data);
        }
      } catch (err) {
        // Graceful fallback from vehicle model fields if offline
        if (!isCancelled) {
          fallbackFromVehicle();
        }
      }
    };

    const applyDashboardData = (data: any) => {
      const today = new Date();
      const currentOdo = Number(data.odometer ?? activeVehicle?.current_odometer ?? 1500);

      // 1. Process Reminders & Alerts
      const reminderAlerts: AlertItem[] = [];
      if (Array.isArray(data.top_reminders) && data.top_reminders.length > 0) {
        data.top_reminders.forEach((r: any) => {
          reminderAlerts.push({
            id: r.id,
            title: r.title || 'Vehicle Reminder',
            category: r.category || 'reminder',
            dueInfo: r.due_info || r.description,
            dueDate: r.target_value ? String(r.target_value).split('T')[0] : undefined,
          });
        });
      }

      // Check insurance in vehicle relationship
      const ins = data.vehicle?.insurance || activeVehicle?.insurance;
      if (ins?.expiry_date || ins?.expiryDate) {
        const expiryStr = ins.expiry_date || ins.expiryDate;
        const exp = new Date(expiryStr);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setInsuranceInfo({
          isSet: true,
          dueDate: expiryStr,
          daysLeft: diffDays,
          provider: ins.provider || 'Comprehensive Cover',
        });
      } else {
        setInsuranceInfo({ isSet: false });
      }

      // Check tax record / PUC in vehicle relationship
      const tax = data.vehicle?.tax_record || data.vehicle?.taxRecord || activeVehicle?.tax_record;
      if (tax?.valid_until) {
        const exp = new Date(tax.valid_until);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setPucInfo({
          isSet: true,
          dueDate: tax.valid_until,
          daysLeft: diffDays,
        });
      } else if (activeVehicle?.puc?.expiryDate) {
        const exp = new Date(activeVehicle.puc.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setPucInfo({
          isSet: true,
          dueDate: activeVehicle.puc.expiryDate,
          daysLeft: diffDays,
        });
      } else {
        setPucInfo({ isSet: false });
      }

      // 2. Next service info
      if (data.next_service_due_odometer != null && Number(data.next_service_due_odometer) > 0) {
        const dueOdo = Number(data.next_service_due_odometer);
        setNextServiceInfo({
          isSet: true,
          dueOdometer: dueOdo,
          remainingKm: dueOdo - currentOdo,
          dueDate: data.last_service?.date || undefined,
          recommendedKm: dueOdo,
        });
      } else {
        setNextServiceInfo({
          isSet: false,
          recommendedKm: currentOdo + 3000,
        });
      }

      // 3. Avg mileage
      if (data.avg_mileage) {
        setAvgMileage(data.avg_mileage);
      } else {
        setAvgMileage('N/A');
      }

      // 4. Financial totals
      const totalExp = Number(data.total_expenses ?? data.this_month_totals?.total ?? 0);
      const fuelThisMonth = Number(data.this_month_totals?.fuel ?? 0);
      setFinancialStats({
        totalExpenses: totalExp,
        fuelThisMonth,
      });

      setAlerts(reminderAlerts);
    };

    const fallbackFromVehicle = () => {
      const today = new Date();
      const currentOdo = Number(activeVehicle?.current_odometer ?? activeVehicle?.odometer ?? 1500);

      // Insurance fallback
      if (activeVehicle?.insurance?.expiryDate) {
        const exp = new Date(activeVehicle.insurance.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setInsuranceInfo({
          isSet: true,
          dueDate: activeVehicle.insurance.expiryDate,
          daysLeft: diffDays,
          provider: activeVehicle.insurance.provider || 'Comprehensive Cover',
        });
      }

      // PUC fallback
      if (activeVehicle?.puc?.expiryDate) {
        const exp = new Date(activeVehicle.puc.expiryDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setPucInfo({
          isSet: true,
          dueDate: activeVehicle.puc.expiryDate,
          daysLeft: diffDays,
        });
      }

      setNextServiceInfo({
        isSet: false,
        recommendedKm: currentOdo + 3000,
      });
    };

    fetchDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, activeVehicle?.id, refreshTrigger]);

  const handleAlertScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activeAlertIndex) {
      setActiveAlertIndex(slide);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Alerts Section (Carousel if multiple alerts) */}
      {alerts.length > 0 && (
        <Animated.View entering={FadeIn.duration(280)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Expiring Soon & Alerts ({alerts.length})
            </Text>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleAlertScroll}
            scrollEventThrottle={16}
            style={styles.alertCarousel}>
            {alerts.map((alert, idx) => (
              <AnimatedPressableCard
                key={alert.id || idx}
                style={[
                  styles.alertCard,
                  isDark && { backgroundColor: '#201A09', borderColor: '#78350F' },
                ]}
                onPress={onAlertPress}
                scaleTo={0.98}>
                <View style={[styles.alertIconWrapper, isDark && { backgroundColor: '#2D230A' }]}>
                  <WarningIcon />
                </View>
                <View style={styles.alertContent}>
                  <View style={styles.alertTopRow}>
                    <Text style={[styles.alertTitle, isDark && { color: '#FBBF24' }]} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <View style={[styles.tag, isDark && { backgroundColor: '#451A03' }]}>
                      <Text style={[styles.tagText, isDark && { color: '#FDE68A' }]}>{alert.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.alertSubtext, isDark && { color: '#FDE68A' }]}>
                    {alert.dueInfo ? (
                      <Text style={[styles.highlightText, isDark && { color: '#F59E0B' }]}>
                        {alert.dueInfo}
                      </Text>
                    ) : alert.dueDate ? (
                      `Due: ${alert.dueDate}`
                    ) : (
                      'Action required soon'
                    )}
                  </Text>
                </View>
              </AnimatedPressableCard>
            ))}
          </ScrollView>

          {/* Carousel Pagination Dots */}
          {alerts.length > 1 && (
            <View style={styles.paginationDots}>
              {alerts.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeAlertIndex ? styles.dotActive : styles.dotInactive,
                    i === activeAlertIndex && { backgroundColor: theme.primaryBlue },
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* 2. Countdowns & Service Status Grid (2x2 Cards with Spring Press Feedback) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Status & Next Due</Text>
      </View>

      <View style={styles.gridContainer}>
        {/* Next Service */}
        <AnimatedPressableCard
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            nextServiceInfo.isSet && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}
          onPress={onNextServicePress}
          scaleTo={0.96}>
          {nextServiceInfo.isSet && (
            <View
              style={[
                styles.statusBadge,
                nextServiceInfo.remainingKm != null && nextServiceInfo.remainingKm <= 500
                  ? styles.statusBadgeUrgent
                  : styles.statusBadgeNormal,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  nextServiceInfo.remainingKm != null && nextServiceInfo.remainingKm <= 500
                    ? styles.statusBadgeTextUrgent
                    : styles.statusBadgeTextNormal,
                ]}>
                {nextServiceInfo.remainingKm != null
                  ? nextServiceInfo.remainingKm <= 0
                    ? 'Overdue'
                    : `In ${nextServiceInfo.remainingKm.toLocaleString()} KM`
                  : 'Scheduled'}
              </Text>
            </View>
          )}
          <Text style={[styles.gridCardLabel, { color: theme.textMuted }]}>Next Service</Text>
          <AnimatedCountText
            style={[
              styles.gridCardValue,
              { color: theme.textPrimary },
              nextServiceInfo.isSet && { color: theme.primaryBlue },
            ]}
            value={
              nextServiceInfo.isSet && nextServiceInfo.dueOdometer != null
                ? `${nextServiceInfo.dueOdometer.toLocaleString()} KM`
                : 'Not Set'
            }
          />
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>
            {nextServiceInfo.isSet
              ? `Due at ${nextServiceInfo.dueOdometer?.toLocaleString()} KM`
              : `Recommended: ${nextServiceInfo.recommendedKm.toLocaleString()} KM`}
          </Text>
        </AnimatedPressableCard>

        {/* Insurance Expiry */}
        <AnimatedPressableCard
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            insuranceInfo.isSet && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}
          onPress={onInsurancePress}
          scaleTo={0.96}>
          {insuranceInfo.isSet && insuranceInfo.daysLeft != null && (
            <View
              style={[
                styles.statusBadge,
                insuranceInfo.daysLeft <= 14 ? styles.statusBadgeUrgent : styles.statusBadgeNormal,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  insuranceInfo.daysLeft <= 14
                    ? styles.statusBadgeTextUrgent
                    : styles.statusBadgeTextNormal,
                ]}>
                {insuranceInfo.daysLeft > 0 ? `${insuranceInfo.daysLeft} days left` : 'Expired / Due'}
              </Text>
            </View>
          )}
          <Text style={[styles.gridCardLabel, { color: theme.textMuted }]}>Insurance Expiry</Text>
          <AnimatedCountText
            style={[
              styles.gridCardValue,
              { color: theme.textPrimary },
              insuranceInfo.isSet && { color: theme.primaryBlue },
            ]}
            value={insuranceInfo.isSet && insuranceInfo.dueDate ? insuranceInfo.dueDate : 'Not Set'}
          />
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]} numberOfLines={1}>
            {insuranceInfo.provider || 'Comprehensive Cover'}
          </Text>
        </AnimatedPressableCard>

        {/* PUC Expiry */}
        <AnimatedPressableCard
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            pucInfo.isSet && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}
          onPress={onPucPress}
          scaleTo={0.96}>
          {pucInfo.isSet && pucInfo.daysLeft != null && (
            <View
              style={[
                styles.statusBadge,
                pucInfo.daysLeft <= 14 ? styles.statusBadgeUrgent : styles.statusBadgeNormal,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  pucInfo.daysLeft <= 14
                    ? styles.statusBadgeTextUrgent
                    : styles.statusBadgeTextNormal,
                ]}>
                {pucInfo.daysLeft > 0 ? `${pucInfo.daysLeft} days left` : 'Expired / Due'}
              </Text>
            </View>
          )}
          <Text style={[styles.gridCardLabel, { color: theme.textMuted }]}>PUC Expiry</Text>
          <AnimatedCountText
            style={[
              styles.gridCardValue,
              { color: theme.textPrimary },
              pucInfo.isSet && { color: theme.primaryBlue },
            ]}
            value={pucInfo.isSet && pucInfo.dueDate ? pucInfo.dueDate : 'Not Set'}
          />
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>Pollution under control</Text>
        </AnimatedPressableCard>

        {/* Avg Mileage */}
        <AnimatedPressableCard
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            avgMileage !== 'N/A' && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}
          onPress={onAnalyticsPress}
          scaleTo={0.96}>
          {avgMileage !== 'N/A' && (
            <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
              <Text style={[styles.statusBadgeText, styles.statusBadgeTextSuccess]}>Live Economy</Text>
            </View>
          )}
          <Text style={[styles.gridCardLabel, { color: theme.textMuted }]}>Avg Mileage</Text>
          <AnimatedCountText
            style={[
              styles.gridCardValue,
              { color: theme.textPrimary },
              avgMileage !== 'N/A' && { color: theme.primaryBlue },
            ]}
            value={avgMileage}
          />
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>KM / Litre</Text>
        </AnimatedPressableCard>
      </View>

      {/* 3. Financial Summary Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Financial & Fuel Summary</Text>
      </View>

      <View style={styles.financialRow}>
        <AnimatedPressableCard
          style={[styles.financeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={onAnalyticsPress}
          scaleTo={0.97}>
          <Text style={[styles.financeLabel, { color: theme.textMuted }]}>Total Expenses Logged</Text>
          <AnimatedCountText
            style={[styles.financeAmount, { color: theme.textPrimary }]}
            value={financialStats.totalExpenses}
            prefix="₹"
          />
          <Text style={[styles.financeSub, { color: theme.textFaint }]}>All time recorded</Text>
        </AnimatedPressableCard>

        <AnimatedPressableCard
          style={[styles.financeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={onAnalyticsPress}
          scaleTo={0.97}>
          <Text style={[styles.financeLabel, { color: theme.textMuted }]}>Fuel This Month</Text>
          <AnimatedCountText
            style={[styles.financeAmount, { color: theme.textPrimary }]}
            value={financialStats.fuelThisMonth}
            prefix="₹"
          />
          <Text style={[styles.financeSub, { color: theme.textFaint }]}>
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </AnimatedPressableCard>
      </View>

      {/* Link to Detailed Analytics */}
      <TouchableOpacity
        style={styles.analyticsLink}
        onPress={onAnalyticsPress}
        activeOpacity={0.75}>
        <Text style={[styles.analyticsLinkText, { color: theme.primaryBlue }]}>
          View Detailed Expense & Mileage Analytics Charts &gt;
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.1,
  },

  /* Alert Card & Carousel */
  alertCarousel: {
    marginBottom: 10,
  },
  alertCard: {
    width: windowWidth - 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  tag: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
  },
  alertSubtext: {
    fontSize: 12,
    color: '#B45309',
  },
  highlightText: {
    fontWeight: '700',
    color: '#D97706',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#2563EB',
  },
  dotInactive: {
    backgroundColor: '#CBD5E1',
  },

  /* 2x2 Grid */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusBadgeNormal: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  statusBadgeUrgent: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadgeTextNormal: {
    color: '#1D4ED8',
  },
  statusBadgeTextUrgent: {
    color: '#B91C1C',
  },
  statusBadgeTextSuccess: {
    color: '#15803D',
  },
  gridCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  gridCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Financial Summary */
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  financeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  financeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  financeAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  financeSub: {
    fontSize: 11,
    color: '#94A3B8',
  },

  /* Analytics Link */
  analyticsLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  analyticsLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
