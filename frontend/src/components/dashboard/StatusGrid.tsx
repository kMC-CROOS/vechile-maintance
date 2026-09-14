import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface StatusGridProps {
  onAnalyticsPress?: () => void;
  onAlertPress?: () => void;
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
  onAnalyticsPress,
  onAlertPress,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Alerts Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Expiring Soon & Alerts (1)</Text>
      </View>

      <TouchableOpacity
        style={styles.alertCard}
        onPress={onAlertPress}
        activeOpacity={0.8}>
        <View style={styles.alertIconWrapper}>
          <WarningIcon />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTopRow}>
            <Text style={styles.alertTitle}>Croos Insurance</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Insurance</Text>
            </View>
          </View>
          <Text style={styles.alertSubtext}>
            Expires in <Text style={styles.highlightText}>9 days</Text> • Due: 2026-09-22
          </Text>
        </View>
      </TouchableOpacity>

      {/* 2. Countdowns & Service Status Grid (2x2 Cards) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Status & Next Due</Text>
      </View>

      <View style={styles.gridContainer}>
        {/* Next Service */}
        <View style={styles.gridCard}>
          <Text style={styles.gridCardLabel}>Next Service</Text>
          <Text style={styles.gridCardValue}>Not Set</Text>
          <Text style={styles.gridCardSub}>Recommended: 4,500 KM</Text>
        </View>

        {/* Insurance Expiry */}
        <View style={[styles.gridCard, styles.gridCardActive]}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>9 days left</Text>
          </View>
          <Text style={styles.gridCardLabel}>Insurance Expiry</Text>
          <Text style={[styles.gridCardValue, styles.activeValueText]}>2026-09-22</Text>
          <Text style={styles.gridCardSub}>Comprehensive Cover</Text>
        </View>

        {/* PUC Expiry */}
        <View style={styles.gridCard}>
          <Text style={styles.gridCardLabel}>PUC Expiry</Text>
          <Text style={styles.gridCardValue}>Not Set</Text>
          <Text style={styles.gridCardSub}>Pollution under control</Text>
        </View>

        {/* Avg Mileage */}
        <View style={styles.gridCard}>
          <Text style={styles.gridCardLabel}>Avg Mileage</Text>
          <Text style={styles.gridCardValue}>N/A</Text>
          <Text style={styles.gridCardSub}>KM / Litre</Text>
        </View>
      </View>

      {/* 3. Financial Summary Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Financial & Fuel Summary</Text>
      </View>

      <View style={styles.financialRow}>
        <View style={styles.financeCard}>
          <Text style={styles.financeLabel}>Total Expenses Logged</Text>
          <Text style={styles.financeAmount}>₹0</Text>
          <Text style={styles.financeSub}>All time recorded</Text>
        </View>

        <View style={styles.financeCard}>
          <Text style={styles.financeLabel}>Fuel This Month</Text>
          <Text style={styles.financeAmount}>₹0</Text>
          <Text style={styles.financeSub}>September 2026</Text>
        </View>
      </View>

      {/* Link to Detailed Analytics */}
      <TouchableOpacity
        style={styles.analyticsLink}
        onPress={onAnalyticsPress}
        activeOpacity={0.75}>
        <Text style={styles.analyticsLinkText}>
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
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B91C1C',
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
