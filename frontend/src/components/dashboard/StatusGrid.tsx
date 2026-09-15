import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';
import { dataCache } from '@/services/dataCache';

interface StatusGridProps {
  activeVehicle?: {
    id?: string | number;
    name?: string;
    odometer?: number;
    current_odometer?: number;
    insurance?: { expiryDate?: string };
    puc?: { expiryDate?: string };
  };
  onAnalyticsPress?: () => void;
  onAlertPress?: () => void;
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

const DOCS_STORAGE_KEY = 'vehiclecare_documents_records';
const SERVICES_STORAGE_KEY = 'vehiclecare_service_records_list';
const FUEL_STORAGE_KEY = 'vehiclecare_fuel_logs_list';
const EXPENSES_STORAGE_KEY = 'vehiclecare_expenses_list';

function getParsedStorage<T>(key: string, force = false): T[] {
  const cacheKey = `status_grid_${key}`;
  if (!force) {
    const cached = dataCache.get<T[]>(cacheKey, 30000);
    if (cached && Array.isArray(cached)) return cached;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dataCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {}
  }
  return [];
}

export const StatusGrid: React.FC<StatusGridProps> = ({
  activeVehicle,
  onAnalyticsPress,
  onAlertPress,
  refreshTrigger = 0,
}) => {
  // Top Alert State
  const [docAlert, setDocAlert] = useState<{
    title: string;
    category: string;
    daysLeft: number;
    dueDate: string;
    totalAlerts: number;
  }>({
    title: 'Vehicle Warranty',
    category: 'warranty',
    daysLeft: 8,
    dueDate: '2026-09-22',
    totalAlerts: 1,
  });

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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const currentOdo = activeVehicle?.odometer ?? activeVehicle?.current_odometer ?? 1500;
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const force = Boolean(refreshTrigger && refreshTrigger > 0);

    // 1. Process Documents (Insurance, PUC, Tax, Warranty, Alerts)
    try {
      const parsedDocs = getParsedStorage<any>(DOCS_STORAGE_KEY, force);

      // Check active vehicle fallback
      let foundInsurance = parsedDocs.find(
        (d: any) =>
          d.category === 'insurance' ||
          d.doc_type === 'insurance' ||
          (d.title && d.title.toLowerCase().includes('insurance'))
      );

      let insuranceDate = foundInsurance?.valid_until || foundInsurance?.expiry_date;
      if (!insuranceDate && activeVehicle?.insurance?.expiryDate) {
        insuranceDate = activeVehicle.insurance.expiryDate;
      }

      if (insuranceDate) {
        const exp = new Date(insuranceDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setInsuranceInfo({
          isSet: true,
          dueDate: insuranceDate,
          daysLeft: diffDays,
          provider: foundInsurance?.provider || 'Comprehensive Cover',
        });
      } else {
        setInsuranceInfo({ isSet: false });
      }

      // PUC Expiry
      let foundPuc = parsedDocs.find(
        (d: any) =>
          d.category === 'puc' ||
          d.doc_type === 'puc' ||
          d.category === 'emission' ||
          (d.title &&
            (d.title.toLowerCase().includes('puc') ||
              d.title.toLowerCase().includes('pollution') ||
              d.title.toLowerCase().includes('emission')))
      );

      let pucDate = foundPuc?.valid_until || foundPuc?.expiry_date;
      if (!pucDate && activeVehicle?.puc?.expiryDate) {
        pucDate = activeVehicle.puc.expiryDate;
      }

      if (pucDate) {
        const exp = new Date(pucDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        setPucInfo({
          isSet: true,
          dueDate: pucDate,
          daysLeft: diffDays,
        });
      } else {
        setPucInfo({ isSet: false });
      }

      // Top Alert computation (earliest expiring active document)
      if (parsedDocs.length > 0) {
        const sorted = parsedDocs
          .map((d: any) => {
            const targetDate = d.valid_until || d.expiry_date || '2026-09-22';
            const exp = new Date(targetDate);
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
            return {
              title: d.title || 'Vehicle Document',
              category: d.doc_type || d.category || 'warranty',
              daysLeft: diffDays,
              dueDate: targetDate,
            };
          })
          .sort((a, b) => a.daysLeft - b.daysLeft);

        const earliest = sorted[0];
        if (earliest) {
          setDocAlert({
            title: earliest.title,
            category: earliest.category,
            daysLeft: earliest.daysLeft,
            dueDate: earliest.dueDate,
            totalAlerts: sorted.length,
          });
        }
      }
    } catch {}

    // 2. Process Service Records (Next Service Due Odometer & Date)
    try {
      const parsedServices = getParsedStorage<any>(SERVICES_STORAGE_KEY, force);
      if (parsedServices.length > 0) {
        // Find most recent service record that specified next_service_due_odometer or nextDueOdometer
        const serviceWithNextDue = parsedServices.find(
          (s: any) =>
            s.next_service_due_odometer != null ||
            s.nextDueOdometer != null ||
            s.next_service_due != null
        );

        if (serviceWithNextDue) {
          const targetDueOdo = Number(
            serviceWithNextDue.next_service_due_odometer ??
              serviceWithNextDue.nextDueOdometer ??
              serviceWithNextDue.next_service_due
          );
          if (!isNaN(targetDueOdo) && targetDueOdo > 0) {
            const remaining = targetDueOdo - currentOdo;
            setNextServiceInfo({
              isSet: true,
              dueOdometer: targetDueOdo,
              remainingKm: remaining,
              dueDate: serviceWithNextDue.service_date,
              recommendedKm: targetDueOdo,
            });
          } else {
            setNextServiceInfo({
              isSet: false,
              recommendedKm: currentOdo + 3000,
            });
          }
        } else {
          setNextServiceInfo({
            isSet: false,
            recommendedKm: currentOdo + 3000,
          });
        }
      } else {
        setNextServiceInfo({
          isSet: false,
          recommendedKm: currentOdo + 3000,
        });
      }
    } catch {}

    // 3. Process Fuel Logs (Avg Mileage KM/L calculation & Fuel This Month)
    let totalFuelThisMonth = 0;
    try {
      const parsedFuel = getParsedStorage<any>(FUEL_STORAGE_KEY, force);
      if (parsedFuel.length > 0) {
        let totalLitres = 0;
        const odoReadings: number[] = [];

        parsedFuel.forEach((f: any) => {
          const litres = Number(f.quantity_litres || f.litres || 0);
          const cost = Number(f.total_cost || f.cost || 0);
          const odo = Number(f.odometer || 0);
          const dateStr = f.fuel_date || f.created_at || '';

          if (litres > 0) totalLitres += litres;
          if (odo > 0) odoReadings.push(odo);
          if (dateStr.startsWith(currentYearMonth)) {
            totalFuelThisMonth += cost;
          }
        });

        if (odoReadings.length >= 2 && totalLitres > 0) {
          const minOdo = Math.min(...odoReadings);
          const maxOdo = Math.max(...odoReadings);
          const kmDriven = maxOdo - minOdo;

          if (kmDriven > 0) {
            const kmPerLitre = (kmDriven / totalLitres).toFixed(1);
            setAvgMileage(`${kmPerLitre} KM/L`);
          } else if (currentOdo > minOdo) {
            const kmDriven = currentOdo - minOdo;
            const kmPerLitre = (kmDriven / totalLitres).toFixed(1);
            setAvgMileage(`${kmPerLitre} KM/L`);
          } else {
            setAvgMileage('N/A');
          }
        } else if (odoReadings.length === 1 && totalLitres > 0 && currentOdo > odoReadings[0]) {
          const kmDriven = currentOdo - odoReadings[0];
          const kmPerLitre = (kmDriven / totalLitres).toFixed(1);
          setAvgMileage(`${kmPerLitre} KM/L`);
        } else {
          setAvgMileage('N/A');
        }
      }
    } catch {}

    // 4. Process Expenses (Total all time recorded)
    let totalAllExpenses = 0;
    try {
      const parsedExp = getParsedStorage<any>(EXPENSES_STORAGE_KEY, force);
      parsedExp.forEach((item: any) => {
        const cost = Number(item.amount || 0);
        if (!isNaN(cost)) totalAllExpenses += cost;
      });
    } catch {}

    setFinancialStats({
      totalExpenses: totalAllExpenses,
      fuelThisMonth: totalFuelThisMonth,
    });
  }, [refreshTrigger, activeVehicle?.odometer, activeVehicle?.insurance?.expiryDate, activeVehicle?.puc?.expiryDate]);

  const { isDark, theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {/* 1. Alerts Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Expiring Soon & Alerts ({docAlert.totalAlerts})
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.alertCard,
          isDark && { backgroundColor: '#201A09', borderColor: '#78350F' },
        ]}
        onPress={onAlertPress}
        activeOpacity={0.8}>
        <View style={[styles.alertIconWrapper, isDark && { backgroundColor: '#2D230A' }]}>
          <WarningIcon />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTopRow}>
            <Text style={[styles.alertTitle, isDark && { color: '#FBBF24' }]} numberOfLines={1}>{docAlert.title}</Text>
            <View style={[styles.tag, isDark && { backgroundColor: '#451A03' }]}>
              <Text style={[styles.tagText, isDark && { color: '#FDE68A' }]}>{docAlert.category}</Text>
            </View>
          </View>
          <Text style={[styles.alertSubtext, isDark && { color: '#FDE68A' }]}>
            Expires in <Text style={[styles.highlightText, isDark && { color: '#F59E0B' }]}>{docAlert.daysLeft > 0 ? `${docAlert.daysLeft} days` : 'Today'}</Text> • Due: {docAlert.dueDate}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 2. Countdowns & Service Status Grid (2x2 Cards) */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Status & Next Due</Text>
      </View>

      <View style={styles.gridContainer}>
        {/* Next Service */}
        <View
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            nextServiceInfo.isSet && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}>
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
          <Text style={[styles.gridCardValue, { color: theme.textPrimary }, nextServiceInfo.isSet && { color: theme.primaryBlue }]}>
            {nextServiceInfo.isSet && nextServiceInfo.dueOdometer != null
              ? `${nextServiceInfo.dueOdometer.toLocaleString()} KM`
              : 'Not Set'}
          </Text>
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>
            {nextServiceInfo.isSet
              ? `Due at ${nextServiceInfo.dueOdometer?.toLocaleString()} KM`
              : `Recommended: ${nextServiceInfo.recommendedKm.toLocaleString()} KM`}
          </Text>
        </View>

        {/* Insurance Expiry */}
        <View
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            insuranceInfo.isSet && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}>
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
          <Text style={[styles.gridCardValue, { color: theme.textPrimary }, insuranceInfo.isSet && { color: theme.primaryBlue }]}>
            {insuranceInfo.isSet && insuranceInfo.dueDate ? insuranceInfo.dueDate : 'Not Set'}
          </Text>
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>
            {insuranceInfo.provider || 'Comprehensive Cover'}
          </Text>
        </View>

        {/* PUC Expiry */}
        <View
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            pucInfo.isSet && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}>
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
          <Text style={[styles.gridCardValue, { color: theme.textPrimary }, pucInfo.isSet && { color: theme.primaryBlue }]}>
            {pucInfo.isSet && pucInfo.dueDate ? pucInfo.dueDate : 'Not Set'}
          </Text>
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>Pollution under control</Text>
        </View>

        {/* Avg Mileage */}
        <View
          style={[
            styles.gridCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            avgMileage !== 'N/A' && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
          ]}>
          {avgMileage !== 'N/A' && (
            <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
              <Text style={[styles.statusBadgeText, styles.statusBadgeTextSuccess]}>Live Economy</Text>
            </View>
          )}
          <Text style={[styles.gridCardLabel, { color: theme.textMuted }]}>Avg Mileage</Text>
          <Text style={[styles.gridCardValue, { color: theme.textPrimary }, avgMileage !== 'N/A' && { color: theme.primaryBlue }]}>
            {avgMileage}
          </Text>
          <Text style={[styles.gridCardSub, { color: theme.textFaint }]}>KM / Litre</Text>
        </View>
      </View>

      {/* 3. Financial Summary Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Financial & Fuel Summary</Text>
      </View>

      <View style={styles.financialRow}>
        <View style={[styles.financeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.financeLabel, { color: theme.textMuted }]}>Total Expenses Logged</Text>
          <Text style={[styles.financeAmount, { color: theme.textPrimary }]}>
            ₹{financialStats.totalExpenses.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.financeSub, { color: theme.textFaint }]}>All time recorded</Text>
        </View>

        <View style={[styles.financeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.financeLabel, { color: theme.textMuted }]}>Fuel This Month</Text>
          <Text style={[styles.financeAmount, { color: theme.textPrimary }]}>
            ₹{financialStats.fuelThisMonth.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.financeSub, { color: theme.textFaint }]}>
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
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

  /* Alert Card */
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 16,
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
  gridCardActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#F0F7FF',
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
  activeValueText: {
    color: '#1D4ED8',
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
