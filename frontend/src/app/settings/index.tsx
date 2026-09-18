import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { useAppTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/services/api';
import { getSetting, setSetting } from '@/services/storage';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { isValidE164 } from '@/utils/phone';

// --- SVGs & Icons ---
const ChevronRightIcon = ({ color = '#94A3B8' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const VehicleIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1M5 17a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DocumentIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MoonIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BellIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DownloadIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"
      stroke="#DC2626"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = ({ color = '#64748B' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const { vehicles, activeVehicle, setActiveVehicle, reloadVehicles } = useVehicle();
  const { isDark, setThemeMode, theme } = useAppTheme();

  // Settings state
  const [notifications, setNotifications] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isManageVehiclesOpen, setIsManageVehiclesOpen] = useState<boolean>(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Profile Edit Form state
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editPhoneValid, setEditPhoneValid] = useState<boolean>(false);
  const [isProfileSaving, setIsProfileSaving] = useState<boolean>(false);

  // Add Vehicle Form state
  const [vehicleType, setVehicleType] = useState<string>('car');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [regNumber, setRegNumber] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [transmission, setTransmission] = useState<string>('Manual');
  const [odometer, setOdometer] = useState<string>('');
  const [isVehicleSaving, setIsVehicleSaving] = useState<boolean>(false);

  // Deleting vehicle state
  const [deletingVehicleId, setDeletingVehicleId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDarkModeToggle = async (val: boolean) => {
    await setThemeMode(val);
    showToast(val ? 'Dark theme enabled.' : 'White-and-Blue theme enabled.');
  };

  const handleNotificationsToggle = async (val: boolean) => {
    setNotifications(val);
    await setSetting('app_reminders_enabled', String(val));
    showToast(val ? 'Service & expiry reminders enabled.' : 'Service reminders silenced.');
  };

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditPhone(user?.phone || '');
    setEditPhoneValid(!!user?.phone && isValidE164(user.phone));
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (editPhone && !editPhoneValid && !isValidE164(editPhone)) {
      Alert.alert('Invalid phone', 'Please enter a valid international phone number.');
      return;
    }
    setIsProfileSaving(true);
    try {
      await updateProfile({ name: editName.trim(), phone: editPhone || undefined });
      setIsEditProfileOpen(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile details.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!brand.trim() || !model.trim() || !regNumber.trim() || !odometer.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in Brand, Model, Registration Number, and Odometer.');
      return;
    }
    const odoNum = parseFloat(odometer.replace(/[^0-9.]/g, ''));
    if (isNaN(odoNum) || odoNum < 0) {
      Alert.alert('Invalid Odometer', 'Please enter a valid positive odometer reading.');
      return;
    }

    setIsVehicleSaving(true);
    try {
      const created = await apiFetch<Vehicle>('/vehicles', {
        method: 'POST',
        body: {
          type: vehicleType,
          brand: brand.trim(),
          model: model.trim(),
          registration_number: regNumber.trim().toUpperCase(),
          fuel_type: fuelType,
          transmission,
          current_odometer: odoNum,
        },
      });

      await reloadVehicles(created?.id);
      setIsAddVehicleOpen(false);
      setBrand('');
      setModel('');
      setRegNumber('');
      setOdometer('');
      showToast(`Added ${created?.brand || brand} ${created?.model || model} successfully!`);
    } catch (err: any) {
      Alert.alert('Failed to Add Vehicle', err.message || 'Error occurred while saving vehicle.');
    } finally {
      setIsVehicleSaving(false);
    }
  };

  const handleDeleteVehicle = (vId: number, vName: string) => {
    const doDelete = async () => {
      setDeletingVehicleId(vId);
      try {
        await apiFetch(`/vehicles/${vId}`, { method: 'DELETE' });
        const updated = await reloadVehicles();
        showToast(`${vName} was deleted.`);
        if (updated.length === 0) {
          setIsManageVehiclesOpen(false);
        }
      } catch (err: any) {
        Alert.alert('Delete Failed', err.message || 'Failed to remove vehicle.');
      } finally {
        setDeletingVehicleId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${vName}? All logs and records will be deleted.`
      );
      if (confirmed) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Vehicle',
        `Are you sure you want to delete ${vName}? All logs and records will be deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    try {
      const currentTarget = activeVehicle || (vehicles.length > 0 ? vehicles[0] : null);
      const filename = `vehicle_data_${currentTarget ? currentTarget.registration_number.replace(/\s+/g, '_') : 'all'}_${new Date().toISOString().slice(0, 10)}.${format}`;

      let content = '';
      let mimeType = 'text/plain';

      if (format === 'json') {
        mimeType = 'application/json';
        const exportObj = {
          exportedAt: new Date().toISOString(),
          user: { name: user?.name, email: user?.email, phone: user?.phone },
          vehicles: vehicles,
          activeVehicle: currentTarget,
        };
        content = JSON.stringify(exportObj, null, 2);
      } else {
        mimeType = 'text/csv';
        const headers = ['Vehicle ID', 'Type', 'Brand', 'Model', 'Registration', 'Fuel', 'Transmission', 'Odometer KM'];
        const rows = vehicles.map((v) => [
          v.id,
          v.type,
          `"${v.brand}"`,
          `"${v.model}"`,
          `"${v.registration_number}"`,
          v.fuel_type,
          v.transmission,
          v.current_odometer,
        ]);
        content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setIsExportModalOpen(false);
      showToast(`Exported ${format.toUpperCase()} file successfully!`);
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Could not compile vehicle export data.');
    }
  };

  const handleSignOut = () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch {
        router.replace('/(auth)/login' as any);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out of VehicleCare?');
      if (confirmed) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of VehicleCare?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const userInitial = (user?.name?.trim() || 'User')[0].toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={(e) => {
            e.preventDefault?.();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)' as any);
            }
          }}
          activeOpacity={0.7}>
          <Text style={[styles.backLink, { color: theme.primaryBlue }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Toast Banner */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: theme.blueSoft, borderBottomColor: theme.blueDim }]}>
          <Text style={[styles.toastText, { color: theme.primaryBlue }]}>✓ {toastMessage}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* User Profile Header Card */}
        <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profileRow}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primaryBlue }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.userEmail, { color: theme.textMuted }]}>{user?.email || 'user@example.com'}</Text>
              {user?.phone ? <Text style={[styles.userPhone, { color: theme.textMuted }]}>📞 {user.phone}</Text> : null}
            </View>
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: theme.blueSoft, borderColor: theme.border }]}
              onPress={(e) => {
                e.preventDefault?.();
                openEditProfile();
              }}
              activeOpacity={0.7}>
              <EditIcon color={theme.primaryBlue} />
              <Text style={[styles.editProfileText, { color: theme.primaryBlue }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 1: VEHICLES */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.sectionHeader }]}>VEHICLES</Text>
          <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Manage Vehicles */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={(e) => {
                e.preventDefault?.();
                setIsManageVehiclesOpen(true);
              }}
              activeOpacity={0.7}>
              <View style={[styles.rowIconContainer, { backgroundColor: theme.iconBg }]}>
                <VehicleIcon color={theme.primaryBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Manage Vehicles</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {activeVehicle
                    ? `Active: ${activeVehicle.brand} ${activeVehicle.model} (${activeVehicle.registration_number})`
                    : 'Switch, view or remove vehicles'}
                </Text>
              </View>
              <ChevronRightIcon color={theme.textFaint} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />

            {/* + Add New Vehicle */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={(e) => {
                e.preventDefault?.();
                setIsAddVehicleOpen(true);
              }}
              activeOpacity={0.7}>
              <View style={[styles.rowIconContainer, { backgroundColor: theme.blueSoft }]}>
                <PlusIcon color={theme.primaryBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.primaryBlue, fontWeight: '700' }]}>
                  + Add New Vehicle
                </Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Register a new bike, car, or scooter</Text>
              </View>
              <ChevronRightIcon color={theme.textFaint} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />

            {/* Tax, Insurance & Warranty Documents */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={(e) => {
                e.preventDefault?.();
                router.push('/(tabs)/docs' as any);
              }}
              activeOpacity={0.7}>
              <View style={[styles.rowIconContainer, { backgroundColor: theme.iconBg }]}>
                <DocumentIcon color={theme.primaryBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Tax, Insurance & Warranty Documents</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>View policies, PUC certificates and records</Text>
              </View>
              <ChevronRightIcon color={theme.textFaint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 2: APP & NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.sectionHeader }]}>APP & NOTIFICATIONS</Text>
          <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Dark Mode */}
            <View style={styles.settingRow}>
              <View style={[styles.rowIconContainer, { backgroundColor: theme.iconBg }]}>
                <MoonIcon color={theme.primaryBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>
                  {isDark ? 'Active: Dark Midnight Theme' : 'Active: Clean White-and-Blue Theme'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />

            {/* Service & Expiry Reminders */}
            <View style={styles.settingRow}>
              <View style={[styles.rowIconContainer, { backgroundColor: theme.iconBg }]}>
                <BellIcon color={theme.primaryBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Service & Expiry Reminders</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Maintenance odometer & renewal alerts</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />

            {/* Export Vehicle Data */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={(e) => {
                e.preventDefault?.();
                setIsExportModalOpen(true);
              }}
              activeOpacity={0.7}>
              <View style={[styles.rowIconContainer, { backgroundColor: theme.iconBg }]}>
                <DownloadIcon color={theme.primaryBlue} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Export Vehicle Data</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted }]}>Download profile & logs as JSON or CSV</Text>
              </View>
              <View style={[styles.exportBadge, { backgroundColor: theme.blueSoft, borderColor: theme.border }]}>
                <Text style={[styles.exportBadgeText, { color: theme.primaryBlue }]}>JSON / CSV</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: ABOUT (Cleaned: Backend Status completely removed) */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.sectionHeader }]}>ABOUT</Text>
          <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>App Version</Text>
              <Text style={[styles.rowVal, { color: theme.textMuted }]}>1.0.0 (Expo SDK 57)</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.signOutBtn,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
              borderColor: isDark ? '#7F1D1D' : '#FECACA',
            },
          ]}
          onPress={(e) => {
            e.preventDefault?.();
            handleSignOut();
          }}
          activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ================= MODALS ================= */}

      {/* 1. EDIT PROFILE MODAL */}
      <Modal
        visible={isEditProfileOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditProfileOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditProfileOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Croos"
              placeholderTextColor={theme.textFaint}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number</Text>
            <PhoneNumberInput
              label=""
              value={editPhone}
              onChangePhone={(e164, meta) => {
                setEditPhone(e164);
                setEditPhoneValid(meta.isValid);
              }}
              colors={{
                text: theme.textPrimary,
                muted: theme.textSecondary,
                faint: theme.textFaint,
                border: theme.inputBorder,
                background: theme.inputBg,
                accent: theme.primaryBlue,
                error: theme.error,
              }}
            />

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address (Read-only)</Text>
            <TextInput
              style={[styles.inputField, { backgroundColor: theme.surface2, borderColor: theme.inputBorder, color: theme.textFaint }]}
              value={user?.email || ''}
              editable={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: theme.iconBg }]}
                onPress={() => setIsEditProfileOpen(false)}
                activeOpacity={0.7}>
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primaryBlue }]}
                onPress={handleSaveProfile}
                disabled={isProfileSaving}
                activeOpacity={0.7}>
                {isProfileSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. MANAGE VEHICLES MODAL */}
      <Modal
        visible={isManageVehiclesOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsManageVehiclesOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Manage Vehicles</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>Select your active vehicle or manage fleet</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsManageVehiclesOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {vehicles.length === 0 ? (
                <View style={styles.emptyVehicles}>
                  <Text style={[styles.emptyVehiclesText, { color: theme.textMuted }]}>No vehicles registered yet.</Text>
                </View>
              ) : (
                vehicles.map((v) => {
                  const isActive = activeVehicle?.id === v.id;
                  const isDeleting = deletingVehicleId === v.id;

                  return (
                    <View
                      key={v.id}
                      style={[
                        styles.vehicleCardItem,
                        { backgroundColor: theme.surface2, borderColor: theme.border },
                        isActive && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
                      ]}>
                      <View style={styles.vehicleItemHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.vehicleItemTitle, { color: theme.textPrimary }]}>
                              {v.brand} {v.model}
                            </Text>
                            {isActive && (
                              <View style={[styles.activeBadge, { backgroundColor: theme.primaryBlue }]}>
                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.vehicleItemPlate, { color: theme.primaryBlue }]}>{v.registration_number}</Text>
                          <Text style={[styles.vehicleItemDetails, { color: theme.textMuted }]}>
                            {v.type?.toUpperCase()} • {v.fuel_type} • {v.transmission} • {v.current_odometer} KM
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.vehicleItemActions, { borderTopColor: theme.borderSoft }]}>
                        {!isActive ? (
                          <TouchableOpacity
                            style={[styles.selectActiveBtn, { backgroundColor: theme.card, borderColor: theme.primaryBlue }]}
                            onPress={() => {
                              setActiveVehicle(v);
                              showToast(`Switched active vehicle to ${v.brand} ${v.model}.`);
                            }}
                            activeOpacity={0.7}>
                            <Text style={[styles.selectActiveBtnText, { color: theme.primaryBlue }]}>Set as Active</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.currentActiveNotice}>
                            <Text style={[styles.currentActiveNoticeText, { color: theme.success }]}>✓ Currently In Use</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={[styles.deleteVehicleBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
                          onPress={() => handleDeleteVehicle(v.id, `${v.brand} ${v.model}`)}
                          disabled={isDeleting}
                          activeOpacity={0.7}>
                          {isDeleting ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                          ) : (
                            <>
                              <TrashIcon />
                              <Text style={styles.deleteVehicleBtnText}>Delete</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.blueSoft, borderColor: theme.border, borderWidth: 1, flex: 1 }]}
                onPress={() => {
                  setIsManageVehiclesOpen(false);
                  setIsAddVehicleOpen(true);
                }}
                activeOpacity={0.7}>
                <Text style={[styles.primaryBtnText, { color: theme.primaryBlue }]}>+ Add New Vehicle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primaryBlue, flex: 1 }]}
                onPress={() => setIsManageVehiclesOpen(false)}
                activeOpacity={0.7}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. ADD NEW VEHICLE MODAL */}
      <Modal
        visible={isAddVehicleOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAddVehicleOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>+ Add New Vehicle</Text>
              <TouchableOpacity
                onPress={() => setIsAddVehicleOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Selection */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Vehicle Type</Text>
              <View style={styles.chipRow}>
                {['bike', 'car', 'scooter', 'truck'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.surface2, borderColor: theme.border },
                      vehicleType === t && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
                    ]}
                    onPress={() => setVehicleType(t)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textSecondary },
                        vehicleType === t && { color: theme.primaryBlue, fontWeight: '700' },
                      ]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brand & Model */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Brand</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="e.g. Honda"
                    placeholderTextColor={theme.textFaint}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Model</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                    value={model}
                    onChangeText={setModel}
                    placeholder="e.g. Activa / Civic"
                    placeholderTextColor={theme.textFaint}
                  />
                </View>
              </View>

              {/* Registration Number */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Registration Number</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                value={regNumber}
                onChangeText={setRegNumber}
                placeholder="e.g. MH 12 AB 1234"
                placeholderTextColor={theme.textFaint}
                autoCapitalize="characters"
              />

              {/* Fuel Type */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Fuel Type</Text>
              <View style={styles.chipRow}>
                {['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.surface2, borderColor: theme.border },
                      fuelType === f && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
                    ]}
                    onPress={() => setFuelType(f)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textSecondary },
                        fuelType === f && { color: theme.primaryBlue, fontWeight: '700' },
                      ]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Transmission */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Transmission</Text>
              <View style={styles.chipRow}>
                {['Manual', 'Automatic'].map((tr) => (
                  <TouchableOpacity
                    key={tr}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.surface2, borderColor: theme.border },
                      transmission === tr && { borderColor: theme.primaryBlue, backgroundColor: theme.blueSoft },
                    ]}
                    onPress={() => setTransmission(tr)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textSecondary },
                        transmission === tr && { color: theme.primaryBlue, fontWeight: '700' },
                      ]}>
                      {tr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Current Odometer */}
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Odometer (KM)</Text>
              <TextInput
                style={[styles.inputField, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="e.g. 15000"
                placeholderTextColor={theme.textFaint}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: theme.iconBg }]}
                onPress={() => setIsAddVehicleOpen(false)}
                activeOpacity={0.7}>
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.primaryBlue }]}
                onPress={handleSaveVehicle}
                disabled={isVehicleSaving}
                activeOpacity={0.7}>
                {isVehicleSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save Vehicle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. EXPORT DATA MODAL */}
      <Modal
        visible={isExportModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsExportModalOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Export Vehicle Data</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>Download offline vehicle data & logs</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsExportModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <CloseIcon color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={[styles.exportOptionCard, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                onPress={() => handleExport('json')}
                activeOpacity={0.7}>
                <View style={[styles.exportOptionIconBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 22 }}>📄</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exportOptionTitle, { color: theme.textPrimary }]}>Export as JSON (.json)</Text>
                  <Text style={[styles.exportOptionDesc, { color: theme.textMuted }]}>
                    Complete structured data including profile, fleet specs, and timestamps.
                  </Text>
                </View>
                <DownloadIcon color={theme.primaryBlue} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportOptionCard, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                onPress={() => handleExport('csv')}
                activeOpacity={0.7}>
                <View style={[styles.exportOptionIconBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 22 }}>📊</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exportOptionTitle, { color: theme.textPrimary }]}>Export as CSV (.csv)</Text>
                  <Text style={[styles.exportOptionDesc, { color: theme.textMuted }]}>
                    Tabular spreadsheet format compatible with Excel, Google Sheets, or Numbers.
                  </Text>
                </View>
                <DownloadIcon color={theme.primaryBlue} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: theme.iconBg, flex: 1 }]}
                onPress={() => setIsExportModalOpen(false)}
                activeOpacity={0.7}>
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: 12,
  },
  backLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  toast: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 50,
    gap: 20,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rowVal: {
    fontSize: 13,
    fontWeight: '500',
  },
  exportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  exportBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signOutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputField: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Vehicles list modal items
  emptyVehicles: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyVehiclesText: {
    fontSize: 14,
  },
  vehicleCardItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  vehicleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleItemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  vehicleItemPlate: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  vehicleItemDetails: {
    fontSize: 12,
    marginTop: 4,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vehicleItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  selectActiveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  selectActiveBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currentActiveNotice: {
    paddingVertical: 4,
  },
  currentActiveNoticeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deleteVehicleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Export options
  exportOptions: {
    gap: 12,
    marginTop: 8,
  },
  exportOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  exportOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  exportOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
