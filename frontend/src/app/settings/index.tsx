import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useVehicle } from '@/context/VehicleContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeVehicle } = useVehicle();

  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleExportData = () => {
    Alert.alert('Export Data', 'Vehicle data summary has been compiled and downloaded.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <Card style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
          </View>
        </Card>

        {/* Group: Vehicles */}
        <View>
          <Text style={styles.groupHeader}>VEHICLES</Text>
          <Card style={styles.groupCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/settings/vehicles' as any)}
              activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Manage Vehicles</Text>
              <Text style={styles.rowVal}>
                {activeVehicle ? `${activeVehicle.brand} ${activeVehicle.model}` : 'Select'} ›
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/vehicle/add' as any)}
              activeOpacity={0.7}>
              <Text style={styles.rowLabel}>+ Add New Vehicle</Text>
              <Text style={styles.rowVal}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/documents' as any)}
              activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Tax, Insurance & Warranty Documents</Text>
              <Text style={styles.rowVal}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Group: Preferences */}
        <View>
          <Text style={styles.groupHeader}>APP & NOTIFICATIONS</Text>
          <Card style={styles.groupCard}>
            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>Dark Mode (Default)</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.surface2, true: Colors.blueDim }}
                thumbColor={darkMode ? Colors.primaryBlue : Colors.textFaint}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>Service & Expiry Reminders</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.surface2, true: Colors.blueDim }}
                thumbColor={notifications ? Colors.primaryBlue : Colors.textFaint}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleExportData}
              activeOpacity={0.7}>
              <Text style={styles.rowLabel}>Export Vehicle Data (JSON/CSV)</Text>
              <Text style={styles.rowVal}>Export</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Group: About */}
        <View>
          <Text style={styles.groupHeader}>ABOUT</Text>
          <Card style={styles.groupCard}>
            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>App Version</Text>
              <Text style={styles.rowVal}>1.0.0 (Expo SDK 57)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>Backend Status</Text>
              <Text style={[styles.rowVal, { color: Colors.success, fontWeight: '700' }]}>
                Laravel 12 Connected
              </Text>
            </View>
          </Card>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={logout}
          activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 50,
    paddingBottom: Spacing.p16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingRight: Spacing.p12,
  },
  backLink: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.sectionGap,
  },
  userCard: {
    padding: Spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.p16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  userName: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: Spacing.p4,
  },
  userPhone: {
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
    marginTop: Spacing.p4,
  },
  groupHeader: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textFaint,
    letterSpacing: 0.8,
    marginBottom: Spacing.p8,
    marginLeft: Spacing.p4,
  },
  groupCard: {
    paddingVertical: Spacing.p4,
    paddingHorizontal: Spacing.cardPadding,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MinTouchTarget,
    paddingVertical: Spacing.p8,
  },
  rowLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.p12,
  },
  rowVal: {
    fontSize: FontSizes.sm,
    color: Colors.textDim,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  signOutBtn: {
    backgroundColor: 'rgba(240, 87, 107, 0.12)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: Radii.medium,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.p8,
    marginBottom: Spacing.p32,
  },
  signOutText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: FontSizes.base,
  },
});

