import { DashboardIcon, DashboardIconName } from './DashboardIcon';
import { SectionHeader } from './SectionHeader';
import { CARD_GAP } from './dashboardLayout';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { AnimatedCountText } from '@/components/ui/AnimatedCountText';
import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';
import { InsuranceDetailsModal } from '@/components/forms/InsuranceDetailsModal';
import { PucDetailsModal } from '@/components/forms/PucDetailsModal';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/services/api';
import { DataCache, dataCache } from '@/services/dataCache';
import {
  calculateDaysRemaining,
  formatDisplayDate,
  getExpiryStatusConfig,
} from '@/utils/dashboardFormatters';
import { formatCurrency } from '@/utils/format';

interface AlertItem {
  id?: string | number;
  title: string;
  category: string;
  daysLeft?: number | null;
  dueDate?: string;
  statusText?: string;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
}

interface StatusGridProps {
  activeVehicle?: {
    id?: string | number;
    user_id?: number;
    name?: string;
    odometer?: number;
    current_odometer?: number;
    insurance?: { expiryDate?: string; provider?: string; policy_number?: string };
    warranty?: { expiryDate?: string };
    tax_record?: { valid_until?: string };
    puc?: { expiryDate?: string; certificate_number?: string };
  } | null;
  onAnalyticsPress?: () => void;
  onAlertPress?: () => void;
  onNextServicePress?: () => void;
  onInsurancePress?: () => void;
  onPucPress?: () => void;
  refreshTrigger?: number;
  onRefreshNeeded?: () => void;
}

function DashboardTile({ title, value, description, icon, color, background, onPress }: {
 title: string; value: string; description: string; icon: DashboardIconName; color: string; background: string; onPress?: () => void;
}) {
 const { width } = useWindowDimensions();
 const wide = width >= 600;
 return <AnimatedPressableCard style={[styles.gridTile, { backgroundColor: background }, wide && styles.wideTile]} onPress={onPress}>
   <View style={[styles.tileIcon, { backgroundColor: color + '18' }]}><DashboardIcon name={icon} color={color} size={wide ? 30 : 24} /></View>
   <View style={styles.tileBody}>
     <Text style={styles.tileLabel}>{title}</Text>
     <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
     <Text style={styles.tileDescription}>{description}</Text>
   </View>
   {wide ? <DashboardIcon name="chevron" size={18} color={color} /> : null}
 </AnimatedPressableCard>;
}

export const StatusGrid: React.FC<StatusGridProps> = ({
  activeVehicle,
  onAnalyticsPress,
  onAlertPress,
  onNextServicePress,
  onInsurancePress,
  onPucPress,
  refreshTrigger = 0,
  onRefreshNeeded,
}) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [periodMenu, setPeriodMenu] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme } = useAppTheme();

  // Modal Visibility States
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [pucModalVisible, setPucModalVisible] = useState(false);

  // Alerts State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // Service State
  const [nextServiceInfo, setNextServiceInfo] = useState<{
    isSet: boolean;
    dueOdometer?: number;
    remainingKm?: number;
    dueDate?: string;
    recommendedKm: number;
  }>({
    isSet: false,
    recommendedKm: 3000,
  });

  // Insurance State
  const [insuranceInfo, setInsuranceInfo] = useState<{
    isSet: boolean;
    dueDate?: string;
    daysLeft?: number | null;
    provider?: string;
    raw?: any;
  }>({
    isSet: false,
  });

  // PUC State
  const [pucInfo, setPucInfo] = useState<{
    isSet: boolean;
    dueDate?: string;
    daysLeft?: number | null;
    raw?: any;
  }>({
    isSet: false,
  });

  // Avg Mileage State
  const [avgMileage, setAvgMileage] = useState<string>('N/A');

  // Financial Stats
  const [financialStats, setFinancialStats] = useState<{
    totalExpenses: number;
    fuelThisMonth: number;
    monthExpenses: number;
  }>({
    totalExpenses: 0,
    fuelThisMonth: 0,
    monthExpenses: 0,
  });

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setLoadError(false);
    setAlerts([]);
    setInsuranceInfo({ isSet: false });
    setPucInfo({ isSet: false });
    setAvgMileage('N/A');
    setFinancialStats({ totalExpenses: 0, fuelThisMonth: 0, monthExpenses: 0 });
    setNextServiceInfo({ isSet: false, recommendedKm: Number(activeVehicle?.current_odometer ?? 0) + 3000 });

    const fetchDashboardData = async () => {
      if (!user?.id || !activeVehicle?.id) {
        setLoading(false);
        setAlerts([]);
        setNextServiceInfo({ isSet: false, recommendedKm: 3000 });
        setInsuranceInfo({ isSet: false });
        setPucInfo({ isSet: false });
        setAvgMileage('N/A');
        setFinancialStats({ totalExpenses: 0, fuelThisMonth: 0, monthExpenses: 0 });
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
        if (!isCancelled) {
          fallbackFromVehicle();
          setLoading(false);
          setLoadError(true);
        }
      }
    };

    const applyDashboardData = (data: any) => {
      setLoading(false);
      setLoadError(false);
      const currentOdo = Number(data.odometer ?? activeVehicle?.current_odometer ?? 0);
      const generatedAlerts: AlertItem[] = [];

      // 1. Insurance Processing
      const ins = data.vehicle?.insurance || activeVehicle?.insurance;
      if (ins?.expiry_date || ins?.expiryDate) {
        const expiryStr = ins.expiry_date || ins.expiryDate;
        const daysLeft = calculateDaysRemaining(expiryStr);
        const statusCfg = getExpiryStatusConfig(daysLeft);

        setInsuranceInfo({
          isSet: true,
          dueDate: expiryStr,
          daysLeft,
          provider: ins.provider || 'Comprehensive Cover',
          raw: ins,
        });

        if (daysLeft !== null && daysLeft <= 30) {
          generatedAlerts.push({
            id: 'insurance-alert',
            title: 'Insurance Renewal (Policy)',
            category: 'Insurance',
            daysLeft,
            dueDate: expiryStr,
            statusText: statusCfg.badgeText,
            textColor: statusCfg.textColor,
            bgColor: statusCfg.bgColor,
            borderColor: statusCfg.borderColor,
          });
        }
      } else {
        setInsuranceInfo({ isSet: false });
      }

      // 2. PUC / Tax Record Processing
      const tax = data.vehicle?.tax_record || data.vehicle?.taxRecord || activeVehicle?.tax_record || activeVehicle?.puc;
      const pucExpiryStr = tax?.valid_until || tax?.expiryDate || activeVehicle?.puc?.expiryDate;

      if (pucExpiryStr) {
        const daysLeft = calculateDaysRemaining(pucExpiryStr);
        const statusCfg = getExpiryStatusConfig(daysLeft);

        setPucInfo({
          isSet: true,
          dueDate: pucExpiryStr,
          daysLeft,
          raw: tax,
        });

        if (daysLeft !== null && daysLeft <= 30) {
          generatedAlerts.push({
            id: 'puc-alert',
            title: 'PUC Certificate Expiry',
            category: 'Emission',
            daysLeft,
            dueDate: pucExpiryStr,
            statusText: statusCfg.badgeText,
            textColor: statusCfg.textColor,
            bgColor: statusCfg.bgColor,
            borderColor: statusCfg.borderColor,
          });
        }
      } else {
        setPucInfo({ isSet: false });
      }

      // 3. Reminders from Backend
      if (Array.isArray(data.top_reminders) && data.top_reminders.length > 0) {
        data.top_reminders.forEach((r: any) => {
          if (!generatedAlerts.some((existing) => existing.title === r.title)) {
            const daysLeft = r.target_value ? calculateDaysRemaining(r.target_value) : null;
            const statusCfg = getExpiryStatusConfig(daysLeft);
            generatedAlerts.push({
              id: r.id,
              title: r.title || 'Vehicle Reminder',
              category: r.category || 'Service',
              daysLeft,
              statusText: r.due_info || statusCfg.badgeText,
              textColor: statusCfg.textColor,
              bgColor: statusCfg.bgColor,
              borderColor: statusCfg.borderColor,
            });
          }
        });
      }

      setAlerts(generatedAlerts);

      // 4. Next Service
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

      // 5. Avg Mileage
      if (data.avg_mileage) {
        setAvgMileage(data.avg_mileage);
      } else {
        setAvgMileage('N/A');
      }

      // 6. Financial Totals
      const totalExp = Number(data.total_expenses ?? data.this_month_totals?.total ?? 0);
      const fuelThisMonth = Number(data.this_month_totals?.fuel ?? 0);
      setFinancialStats({
        totalExpenses: totalExp,
        fuelThisMonth,
        monthExpenses: Number(data.this_month_totals?.total ?? 0),
      });
    };

    const fallbackFromVehicle = () => {
      const currentOdo = Number(activeVehicle?.current_odometer ?? activeVehicle?.odometer ?? 0);

      if (activeVehicle?.insurance?.expiryDate) {
        const daysLeft = calculateDaysRemaining(activeVehicle.insurance.expiryDate);
        setInsuranceInfo({
          isSet: true,
          dueDate: activeVehicle.insurance.expiryDate,
          daysLeft,
          provider: activeVehicle.insurance.provider || 'Comprehensive Cover',
          raw: activeVehicle.insurance,
        });
      }

      if (activeVehicle?.puc?.expiryDate) {
        const daysLeft = calculateDaysRemaining(activeVehicle.puc.expiryDate);
        setPucInfo({
          isSet: true,
          dueDate: activeVehicle.puc.expiryDate,
          daysLeft,
          raw: activeVehicle.puc,
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

  const primaryAlert = alerts.length > 0 ? alerts[0] : null;
  const unavailable = loading || loadError;
  return (
    <View style={styles.container}>
      <View style={styles.alertPanel}>
        <View style={styles.alertHeading}>
          <DashboardIcon name="bell" color="#1497FF" />
          <View style={{ flex: 1 }}><SectionHeader compact title={`Expiring Soon & Alerts (${alerts.length})`} onViewAll={onAlertPress || onAnalyticsPress} /></View>
        </View>
        <AnimatedPressableCard style={[styles.alertCard, { backgroundColor: primaryAlert?.bgColor || '#E6FAF2' }]} onPress={onAlertPress || onAnalyticsPress}>
          <View style={styles.checkCircle}><Text style={styles.checkText}>{primaryAlert ? '!' : unavailable ? '\u2014' : '\u2713'}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.alertTitle, { color: primaryAlert?.textColor || '#079844' }]}>{loading ? 'Checking vehicle alerts...' : loadError ? 'Unable to refresh alerts' : primaryAlert?.title || 'No pending vehicle alerts'}</Text>
            <Text style={styles.tileDescription}>{loadError ? 'Pull down to retry.' : primaryAlert?.statusText || (loading ? 'Please wait' : 'Everything is up to date!')}</Text>
          </View>
        </AnimatedPressableCard>
      </View>
      <SectionHeader title="Status & Next Due" onViewAll={onAnalyticsPress} actionLabel="See Details" />
      <View style={styles.statusRow}>
        <DashboardTile title="Next Service" value={loading ? 'Loading...' : nextServiceInfo.isSet ? `${Math.max(0, nextServiceInfo.remainingKm ?? 0).toLocaleString()} KM` : 'Not Set'}
          description={nextServiceInfo.isSet ? (nextServiceInfo.remainingKm! < 0 ? `Overdue by ${Math.abs(nextServiceInfo.remainingKm!).toLocaleString()} KM` : 'Until next service') : `Recommended: ${nextServiceInfo.recommendedKm.toLocaleString()} KM`}
          icon="service" color="#1769FF" background="#EDF5FF" onPress={onNextServicePress} />
        <DashboardTile title="Insurance Expiry" value={insuranceInfo.isSet ? formatDisplayDate(insuranceInfo.dueDate) : 'Not Set'}
          description={insuranceInfo.isSet ? getExpiryStatusConfig(insuranceInfo.daysLeft).badgeText : 'Comprehensive Cover'}
          icon="shield" color="#F58A00" background="#FFFAF1" onPress={() => setInsuranceModalVisible(true)} />
      </View>
      <View style={styles.statusRow}>
        <DashboardTile title="PUC Expiry" value={pucInfo.isSet ? formatDisplayDate(pucInfo.dueDate) : 'Not Set'}
          description={pucInfo.isSet ? getExpiryStatusConfig(pucInfo.daysLeft).badgeText : 'Pollution under control'}
          icon="leaf" color="#079844" background="#EBFBF5" onPress={() => setPucModalVisible(true)} />
        <DashboardTile title="Avg Mileage" value={avgMileage.replace(/\s*KM\/L$/i, '')} description="KM / Litre"
          icon="gauge" color="#913BE0" background="#F6F0FF" onPress={onAnalyticsPress} />
      </View>
      <View style={styles.financialPanel}>
        <View style={styles.financialHeading}>
          <Text style={styles.sectionTitle}>Financial & Fuel Summary</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose financial period" style={styles.periodButton} onPress={() => setPeriodMenu(!periodMenu)}>
            <Text style={styles.periodText}>{period === 'month' ? 'This Month' : 'All Time'} {'\u2304'}</Text>
          </TouchableOpacity>
        </View>
        {periodMenu ? <View style={styles.periodMenu}>{(['month', 'all'] as const).map((value) => <TouchableOpacity key={value} style={styles.periodButton} onPress={() => { setPeriod(value); setPeriodMenu(false); }}><Text style={styles.periodText}>{value === 'month' ? 'This Month' : 'All Time'}{period === value ? ' \u2713' : ''}</Text></TouchableOpacity>)}</View> : null}
        <View style={styles.statusRow}>
          <DashboardTile title="Total Expenses Logged" value={unavailable ? '\u2014' : formatCurrency(period === 'month' ? financialStats.monthExpenses : financialStats.totalExpenses)} description={period === 'month' ? 'Expenses this month' : 'All recorded expenses'}
            icon="wallet" color="#1769FF" background="#EDF5FF" onPress={onAnalyticsPress} />
          <DashboardTile title="Fuel This Month" value={unavailable ? '\u2014' : formatCurrency(financialStats.fuelThisMonth)} description="Recorded fuel expenses"
            icon="fuel" color="#008B70" background="#EDFCF6" onPress={onAnalyticsPress} />
        </View>
      </View>

      {/* Embedded Modals for direct tiles */}
      {activeVehicle?.id ? (
        <>
          <InsuranceDetailsModal
            visible={insuranceModalVisible}
            onClose={() => setInsuranceModalVisible(false)}
            vehicleId={activeVehicle.id}
            existingInsurance={insuranceInfo.raw}
            onSave={() => {
              dataCache.clear();
              onRefreshNeeded?.();
            }}
          />

          <PucDetailsModal
            visible={pucModalVisible}
            onClose={() => setPucModalVisible(false)}
            vehicleId={activeVehicle.id}
            currentOdometer={activeVehicle.current_odometer || activeVehicle.odometer}
            existingPuc={pucInfo.raw}
            onSave={() => {
              dataCache.clear();
              onRefreshNeeded?.();
            }}
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
 container: { width: '100%', paddingTop: 16 },
 alertPanel: { padding: 12, borderRadius: 22, backgroundColor: '#FFFFFF', shadowColor: '#153A65', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
 alertHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 0 },
 alertCard: { borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
 checkCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#08B957', alignItems: 'center', justifyContent: 'center' },
 checkText: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
 alertTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
 statusRow: { flexDirection: 'row', alignItems: 'stretch', gap: CARD_GAP, marginBottom: CARD_GAP },
 gridTile: { flex: 1, minWidth: 0, minHeight: 136, padding: 12, borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 20, gap: 10, shadowColor: '#264D85', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
 wideTile: { flexDirection: 'row', alignItems: 'center', minHeight: 120, padding: 16 },
 tileIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
 tileBody: { flex: 1, minWidth: 0 },
 tileLabel: { color: '#415A89', fontSize: 12, fontWeight: '600', marginBottom: 8 },
 tileValue: { color: '#090E31', fontSize: 20, fontWeight: '800', marginBottom: 6 },
 tileDescription: { color: '#49648C', fontSize: 11, lineHeight: 16 },
 financialPanel: { marginTop: 14, borderRadius: 24, padding: 12, backgroundColor: '#FFFFFF', marginBottom: 8 },
 financialHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
 sectionTitle: { color: '#090E31', fontSize: 16, fontWeight: '800', flexShrink: 1 },
 periodButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EFF6FF' },
 periodText: { fontSize: 12, color: '#065CFF', fontWeight: '700' },
 periodMenu: { flexDirection: 'row', gap: 8, marginBottom: 12 },
});
