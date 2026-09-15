import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

import { VehicleOverviewCard } from '@/components/dashboard/VehicleOverviewCard';
import { QuickActionsRow } from '@/components/dashboard/QuickActionsRow';
import { StatusGrid } from '@/components/dashboard/StatusGrid';
import { AddServiceModal } from '@/components/forms/AddServiceModal';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import { AddDocumentModal } from '@/components/forms/AddDocumentModal';
import { useAppTheme } from '@/context/ThemeContext';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';

// Settings Gear SVG Icon
const SettingsIcon = ({ color = '#334155' }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Chevron Down Icon
const ChevronDownIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ newVehicle?: string }>();
  const { vehicles, activeVehicle: contextVehicle, setActiveVehicle: setContextVehicle, reloadVehicles } = useVehicle();

  // Unified display vehicle from context with safe fallback
  const displayVehicle = useMemo(() => {
    if (contextVehicle) {
      return {
        id: String(contextVehicle.id),
        name: contextVehicle.brand || contextVehicle.model || 'My Vehicle',
        type: contextVehicle.type || 'Car',
        model: `${contextVehicle.brand || ''} ${contextVehicle.model || ''}`.trim(),
        regNumber: contextVehicle.registration_number || 'CW123',
        odometer: Number(contextVehicle.current_odometer) || 1500,
        raw: contextVehicle,
      };
    }
    return {
      id: '1',
      name: 'Croos',
      type: 'Bike',
      model: 'Honda Xc 700',
      regNumber: 'Cw123',
      odometer: 1500,
      raw: null,
    };
  }, [contextVehicle]);

  // Modal Visibility States
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [odoModalVisible, setOdoModalVisible] = useState(false);
  const [newOdometer, setNewOdometer] = useState(displayVehicle.odometer.toString());

  const [refreshing, setRefreshing] = useState(false);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const { isDark, theme } = useAppTheme();

  // Keep newOdometer string in sync with current vehicle
  useEffect(() => {
    setNewOdometer(String(displayVehicle.odometer));
  }, [displayVehicle.odometer]);

  // Listen for newly saved vehicle from navigation params
  useEffect(() => {
    if (params?.newVehicle) {
      reloadVehicles();
    }
  }, [params?.newVehicle]);

  const onRefresh = async () => {
    setRefreshing(true);
    setDocRefreshKey((k) => k + 1);
    try {
      await reloadVehicles();
    } catch {}
    setRefreshing(false);
  };

  const handleUpdateOdometer = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const val = Number(newOdometer);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid numeric odometer reading');
      return;
    }
    if (contextVehicle) {
      setContextVehicle({ ...contextVehicle, current_odometer: val });
      try {
        await apiFetch(`/vehicles/${contextVehicle.id}`, {
          method: 'PATCH',
          body: { current_odometer: val },
        });
      } catch {}
    }
    setOdoModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* 1. Top Bar */}
        <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.dashboardTitle, { color: theme.textPrimary }]}>Dashboard</Text>
          </View>

          {/* Vehicle Selector Dropdown */}
          <TouchableOpacity
            style={[styles.vehicleSelector, { backgroundColor: theme.blueSoft, borderColor: theme.border }]}
            onPress={() => setSwitcherVisible(true)}
            activeOpacity={0.75}>
            <Text style={[styles.vehicleSelectorText, { color: theme.primaryBlue }]}>
              {displayVehicle.type} - {displayVehicle.name}
            </Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Settings Gear Icon */}
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: theme.iconBg }]}
            onPress={() => router.push('/settings' as any)}
            activeOpacity={0.7}>
            <SettingsIcon color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Dashboard Body */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryBlue} />}>
          
          {/* 2. Vehicle Overview Card */}
          <VehicleOverviewCard
            vehicleName={displayVehicle.name}
            category={displayVehicle.type}
            modelDetails={`${displayVehicle.model} • ${displayVehicle.regNumber}`}
            odometer={displayVehicle.odometer}
            onEditPress={() => {
              setNewOdometer(displayVehicle.odometer.toString());
              setOdoModalVisible(true);
            }}
          />

          {/* 3. Quick Actions Row (Add Service, Add Expense, Add Document) */}
          <QuickActionsRow
            onAddService={() => setServiceModalVisible(true)}
            onAddExpense={() => setExpenseModalVisible(true)}
            onAddDocument={() => setDocModalVisible(true)}
          />

          {/* 4. Alerts, 2x2 Status Grid & Financial Summary */}
          <StatusGrid
            activeVehicle={displayVehicle}
            onAnalyticsPress={() => router.push('/(tabs)/analytics' as any)}
            onAlertPress={() => setDocModalVisible(true)}
            refreshTrigger={docRefreshKey}
          />
        </ScrollView>

        {/* 5. Modals for Action Forms */}
        <AddServiceModal
          visible={serviceModalVisible}
          onClose={() => setServiceModalVisible(false)}
          currentOdometer={displayVehicle.odometer}
          onSave={(data) => {
            if (data?.odometer && data.odometer > displayVehicle.odometer && contextVehicle) {
              setContextVehicle({ ...contextVehicle, current_odometer: data.odometer });
            }
            setDocRefreshKey((k) => k + 1);
          }}
        />

        <AddExpenseModal
          visible={expenseModalVisible}
          onClose={() => setExpenseModalVisible(false)}
          onSave={(_data) => {
            setDocRefreshKey((k) => k + 1);
          }}
        />

        <AddDocumentModal
          visible={docModalVisible}
          onClose={() => setDocModalVisible(false)}
          vehicleId={displayVehicle.id}
          onSave={(_doc) => {
            setDocRefreshKey((k) => k + 1);
          }}
        />

        {/* Vehicle Switcher Modal */}
        <Modal visible={switcherVisible} transparent animationType="fade">
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
            activeOpacity={1}
            onPress={() => setSwitcherVisible(false)}>
            <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Vehicle</Text>
              
              {vehicles && vehicles.length > 0 ? (
                vehicles.map((v) => {
                  const isSelected = contextVehicle?.id === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.modalVehicleItem,
                        { backgroundColor: theme.surface2, borderColor: theme.border },
                        isSelected && [
                          styles.modalVehicleItemActive,
                          { backgroundColor: theme.blueSoft, borderColor: theme.primaryBlue },
                        ],
                      ]}
                      onPress={() => {
                        setContextVehicle(v);
                        setSwitcherVisible(false);
                      }}>
                      <Text style={[styles.modalVehicleName, { color: theme.textPrimary }]}>
                        {v.type || 'Vehicle'} - {v.brand} {v.model}
                      </Text>
                      {isSelected && (
                        <Text style={[styles.modalVehicleActiveCheck, { color: theme.primaryBlue }]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <TouchableOpacity
                  style={[
                    styles.modalVehicleItem,
                    { backgroundColor: theme.blueSoft, borderColor: theme.primaryBlue },
                  ]}
                  onPress={() => setSwitcherVisible(false)}>
                  <Text style={[styles.modalVehicleName, { color: theme.textPrimary }]}>
                    {displayVehicle.type} - {displayVehicle.name}
                  </Text>
                  <Text style={[styles.modalVehicleActiveCheck, { color: theme.primaryBlue }]}>✓</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.addVehicleBtn}
                onPress={() => {
                  setSwitcherVisible(false);
                  router.push('/vehicle/add' as any);
                }}>
                <Text style={[styles.addVehicleBtnText, { color: theme.primaryBlue }]}>+ Add New Vehicle</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Edit Odometer Modal */}
        <Modal visible={odoModalVisible} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
            <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Update Current Mileage</Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>Enter updated odometer reading in kilometers</Text>
              <TextInput
                style={[styles.odoInput, { backgroundColor: theme.inputBg, borderColor: theme.primaryBlue, color: theme.textPrimary }]}
                value={newOdometer}
                onChangeText={setNewOdometer}
                placeholderTextColor={theme.textFaint}
                keyboardType="numeric"
                autoFocus
              />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { backgroundColor: theme.iconBg }]}
                  onPress={() => setOdoModalVisible(false)}>
                  <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, { backgroundColor: theme.primaryBlue }]}
                  onPress={handleUpdateOdometer}>
                  <Text style={styles.modalSaveText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  vehicleSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalVehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  modalVehicleItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  modalVehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalVehicleActiveCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  addVehicleBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  addVehicleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  odoInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
