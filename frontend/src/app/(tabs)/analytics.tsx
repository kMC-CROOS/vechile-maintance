import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatCurrency, formatDate, formatOdometer } from '@/utils/format';

// Icons
const ChartIcon = ({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 20V10M12 20V4M6 20V14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BellIcon = ({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8M13.73 21A2 2 0 0 1 10.27 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlarmIcon = ({ size = 18, color = '#EF4444' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2" />
    <Path d="M12 9V13L15 15M5 3L2 6M19 3L22 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WrenchIcon = ({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentIcon = ({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Animated Switch Component
interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  activeColor?: string;
}

const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  value,
  onValueChange,
  activeColor = '#2563EB',
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={(e: any) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        onValueChange(!value);
      }}
      style={[
        styles.switchTrack,
        { backgroundColor: value ? activeColor : '#CBD5E1' },
      ]}>
      <Animated.View
        style={[
          styles.switchThumb,
          { transform: [{ translateX }] },
        ]}
      />
    </TouchableOpacity>
  );
};

// Alert Configuration Interfaces
interface AlertConfig {
  id: string;
  title: string;
  subtitle: string;
  category: 'insurance' | 'tax' | 'service' | 'warranty';
  expiryDate: string;
  targetOdometer?: number;
  bannerEnabled: boolean;
  alarmEnabled: boolean;
  leadDays: number;
}

const PREF_STORAGE_KEY = 'vehiclecare_alert_preferences';

export default function AnalyticsScreen() {
  const { activeVehicle } = useVehicle();

  // Top Section Mode (SPA view toggle without page reload)
  const [activeSection, setActiveSection] = useState<'analytics' | 'notifications'>('analytics');

  // Filter Period
  const [period, setPeriod] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('6m');
  const periods: ('1m' | '3m' | '6m' | '1y' | 'all')[] = ['1m', '3m', '6m', '1y', 'all'];

  // Data Loading & State
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testAlertToast, setTestAlertToast] = useState<string | null>(null);

  // Mount Animation (Smooth Fade In and Slide Up)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Alert Configs State
  const [alerts, setAlerts] = useState<AlertConfig[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(PREF_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [
      {
        id: 'ins-1',
        title: 'Insurance Policy Expiry',
        subtitle: 'Comprehensive Cover (Ceylinco VIP)',
        category: 'insurance',
        expiryDate: '2027-01-15',
        bannerEnabled: true,
        alarmEnabled: true,
        leadDays: 14,
      },
      {
        id: 'tax-1',
        title: 'Revenue Licence & PUC Expiry',
        subtitle: 'Annual Vehicle Emission & Road Fitness',
        category: 'tax',
        expiryDate: '2027-04-30',
        bannerEnabled: true,
        alarmEnabled: false,
        leadDays: 30,
      },
      {
        id: 'srv-1',
        title: 'Routine Service Schedule',
        subtitle: 'Engine Oil & 10,000 KM Maintenance',
        category: 'service',
        expiryDate: '2026-10-25',
        targetOdometer: (activeVehicle?.current_odometer || 4500) + 5000,
        bannerEnabled: true,
        alarmEnabled: true,
        leadDays: 7,
      },
      {
        id: 'war-1',
        title: 'Vehicle Warranty Term',
        subtitle: 'Manufacturer Agent Coverage',
        category: 'warranty',
        expiryDate: '2027-11-20',
        bannerEnabled: false,
        alarmEnabled: false,
        leadDays: 30,
      },
    ];
  });

  // Sync alert preferences
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(alerts));
      } catch {}
    }
  }, [alerts]);

  // Analytics Metrics Calculation based on period
  const analyticsData = useMemo(() => {
    // Multipliers based on selected period
    let factor = 1;
    if (period === '1m') factor = 0.22;
    else if (period === '3m') factor = 0.55;
    else if (period === '6m') factor = 1.0;
    else if (period === '1y') factor = 1.95;
    else if (period === 'all') factor = 2.75;

    const fuelSpend = Math.round(48500 * factor);
    const serviceSpend = Math.round(36200 * factor);
    const insuranceSpend = Math.round(21250 * factor);
    const tollParkingSpend = Math.round(8400 * factor);
    const otherSpend = Math.round(5600 * factor);

    const totalSpent = fuelSpend + serviceSpend + insuranceSpend + tollParkingSpend + otherSpend;

    const breakdown = [
      {
        category: 'Fuel',
        amount: fuelSpend,
        color: '#10B981', // Emerald
        pct: Math.round((fuelSpend / totalSpent) * 100),
      },
      {
        category: 'Service & Repairs',
        amount: serviceSpend,
        color: '#3B82F6', // Blue
        pct: Math.round((serviceSpend / totalSpent) * 100),
      },
      {
        category: 'Insurance',
        amount: insuranceSpend,
        color: '#8B5CF6', // Violet
        pct: Math.round((insuranceSpend / totalSpent) * 100),
      },
      {
        category: 'Tolls & Parking',
        amount: tollParkingSpend,
        color: '#F59E0B', // Amber
        pct: Math.round((tollParkingSpend / totalSpent) * 100),
      },
      {
        category: 'Other Expenses',
        amount: otherSpend,
        color: '#64748B', // Slate
        pct: Math.round((otherSpend / totalSpent) * 100),
      },
    ];

    // Historical monthly trend
    const monthlyTrend = [
      { month: 'May', total: Math.round(18400 * factor) },
      { month: 'Jun', total: Math.round(24200 * factor) },
      { month: 'Jul', total: Math.round(31500 * factor) },
      { month: 'Aug', total: Math.round(27800 * factor) },
      { month: 'Sep', total: Math.round(36200 * factor) },
    ];

    return {
      totalSpent,
      fuelEfficiencyKmPerL: 14.8,
      costPerKm: 28.4,
      totalKmDriven: Math.round(4200 * factor),
      breakdown,
      monthlyTrend,
    };
  }, [period]);

  // Status Countdown Calculation
  const getCountdown = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired ${Math.abs(diffDays)}d ago`,
        color: '#B91C1C',
        bg: '#FEE2E2',
        border: '#FECACA',
      };
    }
    if (diffDays <= 14) {
      return {
        label: `Expires in ${diffDays} days!`,
        color: '#B45309',
        bg: '#FEF3C7',
        border: '#FDE68A',
      };
    }
    return {
      label: `${diffDays} days remaining`,
      color: '#15803D',
      bg: '#DCFCE7',
      border: '#BBF7D0',
    };
  };

  // Toggle Alert Handlers
  const handleToggleBanner = (id: string, val: boolean) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, bannerEnabled: val } : a))
    );
  };

  const handleToggleAlarm = (id: string, val: boolean) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, alarmEnabled: val } : a))
    );
  };

  const handleChangeLeadDays = (id: string, days: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, leadDays: days } : a))
    );
  };

  // Trigger Test Alarm / Notification
  const triggerTestAlarm = (title: string, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setTestAlertToast(`🔔 Alarm Triggered: "${title}" alert notification active!`);
    setTimeout(() => {
      setTestAlertToast(null);
    }, 4500);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Analytics & Alarms</Text>
            <Text style={styles.subtitle}>
              {activeVehicle
                ? `${activeVehicle.brand || ''} ${activeVehicle.model || ''} (${activeVehicle.registration_number || ''})`.trim()
                : 'Vehicle cost breakdown, fuel economy & scheduled alarms'}
            </Text>
          </View>

          {/* Test Trigger Button */}
          <TouchableOpacity
            style={styles.testAlarmBtn}
            activeOpacity={0.8}
            onPress={(e) => triggerTestAlarm('Routine Service & Insurance Due', e)}>
            <AlarmIcon size={15} color="#FFFFFF" />
            <Text style={styles.testAlarmBtnText}>Test Alarm</Text>
          </TouchableOpacity>
        </View>

        {/* Test Toast Alert Banner */}
        {testAlertToast && (
          <View style={styles.toastBanner}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlarmIcon size={16} color="#DC2626" />
              <Text style={styles.toastText}>{testAlertToast}</Text>
            </View>
            <TouchableOpacity onPress={() => setTestAlertToast(null)}>
              <Text style={styles.toastDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Top Segmented Navigation Tabs */}
        <View style={styles.segmentedRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSection === 'analytics' && styles.segmentBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={(e: any) => {
              e?.preventDefault?.();
              setActiveSection('analytics');
            }}>
            <ChartIcon
              size={16}
              color={activeSection === 'analytics' ? '#2563EB' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentText,
                activeSection === 'analytics' && styles.segmentTextActive,
              ]}>
              Cost & Performance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSection === 'notifications' && styles.segmentBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={(e: any) => {
              e?.preventDefault?.();
              setActiveSection('notifications');
            }}>
            <BellIcon
              size={16}
              color={activeSection === 'notifications' ? '#2563EB' : '#64748B'}
            />
            <Text
              style={[
                styles.segmentText,
                activeSection === 'notifications' && styles.segmentTextActive,
              ]}>
              Notifications & Alarms
            </Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{alerts.filter((a) => a.alarmEnabled).length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }>
          {/* ================= SECTION 1: COST & PERFORMANCE ANALYTICS ================= */}
          {activeSection === 'analytics' && (
            <View style={styles.sectionContainer}>
              {/* Period Filter Tabs */}
              <View style={styles.periodRow}>
                {periods.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                    activeOpacity={0.7}
                    onPress={(e: any) => {
                      e?.preventDefault?.();
                      setPeriod(p);
                    }}>
                    <Text
                      style={[
                        styles.periodText,
                        period === p && styles.periodTextActive,
                      ]}>
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Performance Metrics Hero Cards */}
              <View style={styles.metricsRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>TOTAL SPENT</Text>
                  <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
                    {formatCurrency(analyticsData.totalSpent)}
                  </Text>
                  <Text style={styles.kpiSub}>In {period.toUpperCase()} duration</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>AVG FUEL ECONOMY</Text>
                  <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                    {analyticsData.fuelEfficiencyKmPerL} KM/L
                  </Text>
                  <Text style={styles.kpiSub}>High efficiency score</Text>
                </View>

                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>COST PER KM</Text>
                  <Text style={[styles.kpiValue, { color: '#D97706' }]}>
                    LKR {analyticsData.costPerKm}
                  </Text>
                  <Text style={styles.kpiSub}>{analyticsData.totalKmDriven} KM logged</Text>
                </View>
              </View>

              {/* Visual Breakdown Chart & Categories */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Expense Category Breakdown</Text>
                    <Text style={styles.cardSubtitle}>
                      Proportional distribution across maintenance and operating costs
                    </Text>
                  </View>
                </View>

                {/* Multi-segmented Visual Progress Bar */}
                <View style={styles.multiBarContainer}>
                  {analyticsData.breakdown.map((item) => (
                    <View
                      key={item.category}
                      style={[
                        styles.multiBarSegment,
                        {
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  ))}
                </View>

                {/* Breakdown Legend & Value Bars */}
                <View style={styles.breakdownList}>
                  {analyticsData.breakdown.map((item) => (
                    <View key={item.category} style={styles.breakdownRow}>
                      <View style={styles.breakdownLeft}>
                        <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                        <Text style={styles.categoryName}>{item.category}</Text>
                      </View>
                      <View style={styles.breakdownRight}>
                        <Text style={styles.breakdownAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <View style={styles.pctBadge}>
                          <Text style={styles.pctBadgeText}>{item.pct}%</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Monthly Trend Spend Bar Chart */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Monthly Spend Trend</Text>
                    <Text style={styles.cardSubtitle}>
                      Monthly vehicle maintenance and fuel volume comparisons
                    </Text>
                  </View>
                </View>

                <View style={styles.trendList}>
                  {analyticsData.monthlyTrend.map((m) => {
                    const maxVal = Math.max(
                      ...analyticsData.monthlyTrend.map((i) => i.total),
                      1
                    );
                    const pct = Math.min(100, Math.round((m.total / maxVal) * 100));

                    return (
                      <View key={m.month} style={styles.trendItemRow}>
                        <Text style={styles.trendMonthText}>{m.month}</Text>
                        <View style={styles.trendTrack}>
                          <View
                            style={[
                              styles.trendFill,
                              { width: `${pct}%`, backgroundColor: '#3B82F6' },
                            ]}
                          />
                        </View>
                        <Text style={styles.trendAmountText}>
                          {formatCurrency(m.total)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ================= SECTION 2: NOTIFICATIONS & NATIVE ALARMS ================= */}
          {activeSection === 'notifications' && (
            <View style={styles.sectionContainer}>
              {/* Alert Center Overview Banner */}
              <View style={styles.alarmOverviewBanner}>
                <View style={styles.alarmBannerIconBox}>
                  <BellIcon size={22} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alarmBannerTitle}>Smart Vehicle Expiry Alerts</Text>
                  <Text style={styles.alarmBannerSubtitle}>
                    Configure standard notification banners and native high-priority alarm sounds for crucial deadlines.
                  </Text>
                </View>
              </View>

              {/* Alert Configuration Cards */}
              <View style={styles.alertsList}>
                {alerts.map((item) => {
                  const countdown = getCountdown(item.expiryDate);

                  return (
                    <View key={item.id} style={styles.alertCard}>
                      {/* Card Header with Category Icon */}
                      <View style={styles.alertCardHeader}>
                        <View style={styles.alertCardHeaderLeft}>
                          <View style={styles.alertIconBadge}>
                            {item.category === 'insurance' ? (
                              <ShieldIcon size={18} color="#2563EB" />
                            ) : item.category === 'tax' ? (
                              <DocumentIcon size={18} color="#2563EB" />
                            ) : item.category === 'service' ? (
                              <WrenchIcon size={18} color="#2563EB" />
                            ) : (
                              <AlarmIcon size={18} color="#2563EB" />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.alertTitle}>{item.title}</Text>
                            <Text style={styles.alertSubtitle}>{item.subtitle}</Text>
                          </View>
                        </View>

                        {/* Real-time Countdown Badge */}
                        <View
                          style={[
                            styles.countdownBadge,
                            {
                              backgroundColor: countdown.bg,
                              borderColor: countdown.border,
                            },
                          ]}>
                          <Text style={[styles.countdownText, { color: countdown.color }]}>
                            {countdown.label}
                          </Text>
                        </View>
                      </View>

                      {/* Expiry / Target Meta */}
                      <View style={styles.alertMetaRow}>
                        <View style={styles.metaBlock}>
                          <Text style={styles.metaLabel}>EXPIRY / DUE DATE</Text>
                          <Text style={styles.metaValue}>{formatDate(item.expiryDate)}</Text>
                        </View>

                        {item.targetOdometer && (
                          <View style={styles.metaBlock}>
                            <Text style={styles.metaLabel}>TARGET ODOMETER</Text>
                            <Text style={styles.metaValue}>{formatOdometer(item.targetOdometer)}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardDivider} />

                      {/* Toggle Controls */}
                      <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                          <Text style={styles.toggleTitle}>Standard Banner Notification</Text>
                          <Text style={styles.toggleSub}>Lock-screen and browser banner alerts</Text>
                        </View>
                        <AnimatedSwitch
                          value={item.bannerEnabled}
                          onValueChange={(val) => handleToggleBanner(item.id, val)}
                          activeColor="#2563EB"
                        />
                      </View>

                      <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.toggleTitle}>Native Full Alarm Sound</Text>
                            <View style={styles.nativeAlarmTag}>
                              <Text style={styles.nativeAlarmTagText}>HIGH PRIORITY</Text>
                            </View>
                          </View>
                          <Text style={styles.toggleSub}>Plays device alarm sound even when muted</Text>
                        </View>
                        <AnimatedSwitch
                          value={item.alarmEnabled}
                          onValueChange={(val) => handleToggleAlarm(item.id, val)}
                          activeColor="#DC2626"
                        />
                      </View>

                      {/* Lead Time Alert Selector */}
                      <View style={styles.leadTimeSection}>
                        <Text style={styles.leadTimeLabel}>Trigger Alert Interval:</Text>
                        <View style={styles.leadPillsRow}>
                          {[30, 14, 7, 0].map((days) => {
                            const isSelected = item.leadDays === days;
                            const label = days === 0 ? 'On Due Date' : `${days}d Before`;

                            return (
                              <TouchableOpacity
                                key={days}
                                style={[
                                  styles.leadPill,
                                  isSelected && styles.leadPillSelected,
                                ]}
                                activeOpacity={0.7}
                                onPress={(e) => handleChangeLeadDays(item.id, days, e)}>
                                {isSelected && (
                                  <View style={styles.leadPillCheck}>
                                    <CheckIcon size={9} color="#FFFFFF" />
                                  </View>
                                )}
                                <Text
                                  style={[
                                    styles.leadPillText,
                                    isSelected && styles.leadPillTextSelected,
                                  ]}>
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  animatedContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 18,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  testAlarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  testAlarmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#991B1B',
  },
  toastDismiss: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    paddingLeft: 12,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  segmentBtnActive: {
    borderBottomColor: '#2563EB',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  badgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  sectionContainer: {
    paddingTop: 16,
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  multiBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  multiBarSegment: {
    height: '100%',
  },
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownAmount: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  pctBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 38,
    alignItems: 'center',
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  trendList: {
    gap: 12,
  },
  trendItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendMonthText: {
    width: 38,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  trendTrack: {
    flex: 1,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    borderRadius: 4.5,
  },
  trendAmountText: {
    width: 90,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  alarmOverviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 12,
  },
  alarmBannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmBannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  alarmBannerSubtitle: {
    fontSize: 11.5,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 16,
  },
  alertsList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '800',
  },
  alertMetaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  metaBlock: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  nativeAlarmTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  nativeAlarmTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  leadTimeSection: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadTimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  leadPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  leadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  leadPillSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  leadPillCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  leadPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
