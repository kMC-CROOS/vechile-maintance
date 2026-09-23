import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { VehicleOverviewCard } from '@/components/dashboard/VehicleOverviewCard';
import { QuickActionsRow } from '@/components/dashboard/QuickActionsRow';
import { StatusGrid } from '@/components/dashboard/StatusGrid';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';
import { AddServiceModal } from '@/components/forms/AddServiceModal';
import { AddExpenseModal } from '@/components/forms/AddExpenseModal';
import { AddDocumentModal } from '@/components/forms/AddDocumentModal';
import { DashboardIcon } from '@/components/dashboard/DashboardIcon';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { dataCache } from '@/services/dataCache';

const SCREEN_PADDING = 16;

const validNonNegativeNumber = (val: string | number) => {
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

// Settings Gear SVG Icon
const SettingsIcon = ({ color = '#101828' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
const ChevronDownIcon = ({ color = '#1769FF' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Trash Can Delete Icon
const TrashIcon = ({ color = '#EF4444' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 20.0391 5 20.5304 5 20V6H19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ newVehicle?: string }>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const {
    vehicles,
    activeVehicle: contextVehicle,
    setActiveVehicle: setContextVehicle,
    reloadVehicles,
    deleteVehicle,
    isLoading,
  } = useVehicle();

  const tabBarHeight = width >= 600 ? 80 : 64;

  useEffect(() => {
    if (!isLoading && vehicles.length === 0) {
      router.replace('/vehicle/add' as any);
    }
  }, [isLoading, vehicles.length]);

  const displayVehicle = useMemo(() => {
    if (contextVehicle && (!contextVehicle.user_id || contextVehicle.user_id === user?.id)) {
      return {
        id: String(contextVehicle.id),
        user_id: contextVehicle.user_id,
        name: contextVehicle.brand || contextVehicle.model || 'My Vehicle',
        type: contextVehicle.type || 'Car',
        model: `${contextVehicle.brand || ''} ${contextVehicle.model || ''}`.trim(),
        regNumber: contextVehicle.registration_number || '',
        odometer: Number(contextVehicle.current_odometer) || 0,
        fuelType: contextVehicle.fuel_type || 'Petrol',
        photoUrl: contextVehicle.photo_url || null,
        raw: contextVehicle,
      };
    }
    if (vehicles.length > 0) {
      const first = vehicles[0];
      return {
        id: String(first.id),
        user_id: first.user_id,
        name: first.brand || first.model || 'My Vehicle',
        type: first.type || 'Car',
        model: `${first.brand || ''} ${first.model || ''}`.trim(),
        regNumber: first.registration_number || '',
        odometer: Number(first.current_odometer) || 0,
        fuelType: first.fuel_type || 'Petrol',
        photoUrl: first.photo_url || null,
        raw: first,
      };
    }
    return null;
  }, [contextVehicle, vehicles, user?.id]);

  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [odoModalVisible, setOdoModalVisible] = useState(false);
  const [newOdometer, setNewOdometer] = useState(
    displayVehicle ? String(displayVehicle.odometer) : '0'
  );

  const [odoSaving, setOdoSaving] = useState(false);
  const [odoError, setOdoError] = useState<string | null>(null);
  const odoPending = React.useRef(false);

  const [refreshing, setRefreshing] = useState(false);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const { theme } = useAppTheme();

  useEffect(() => {
    if (displayVehicle) {
      setNewOdometer(String(displayVehicle.odometer));
      setOdoError(null);
    }
  }, [displayVehicle?.odometer]);

  useEffect(() => {
    if (params?.newVehicle) {
      reloadVehicles();
    }
  }, [params?.newVehicle]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        setDocRefreshKey((k) => k + 1);
      }
    }, [user?.id, contextVehicle?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    dataCache.clear();
    setDocRefreshKey((k) => k + 1);
    try {
      await reloadVehicles();
    } catch {}
    setRefreshing(false);
  };

  const handleUpdateOdometer = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (odoPending.current || !contextVehicle) return;
    const val = Number(newOdometer);
    if (!validNonNegativeNumber(newOdometer) || val < Number(contextVehicle.current_odometer || 0)) {
      setOdoError('Enter a valid reading equal to or greater than the current odometer.');
      return;
    }
    odoPending.current = true;
    setOdoSaving(true);
    setOdoError(null);
    try {
      await apiFetch(`/vehicles/${contextVehicle.id}`, { method: 'PUT', body: { current_odometer: val } });
      setContextVehicle({ ...contextVehicle, current_odometer: val });
      dataCache.clear();
      setDocRefreshKey((k) => k + 1);
      setOdoModalVisible(false);
    } catch (err: any) {
      setOdoError(err?.message || 'Could not save the odometer. Please try again.');
    } finally {
      odoPending.current = false;
      setOdoSaving(false);
    }
  };

  const navigateToSettings = () => router.push('/settings' as any);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* 1. Header with Clean Background & Proper Alignments */}
        <Animated.View entering={FadeInDown.duration(240)} style={styles.headerContainer}>
          <View style={styles.topBarRow}>
            {/* Title & Subtitle */}
            <View style={styles.headerTitleArea}>
              <Text style={styles.dashboardTitle}>Dashboard</Text>
              <Text style={styles.dashboardSubtitle}>Your Vehicle, Our Care</Text>
            </View>

            {/* Right Controls: Vehicle Switcher Pill & Settings Gear */}
            <View style={styles.rightHeaderControls}>
              <AnimatedPressableCard
                style={[styles.vehicleSelectorPill, { maxWidth: width < 360 ? 120 : 155 }]}
                onPress={() => setSwitcherVisible(true)}
                scaleTo={0.95}
                accessibilityLabel="Select vehicle">
                <DashboardIcon name={displayVehicle?.type.toLowerCase().includes('bike') ? 'bike' : 'gauge'} size={16} color="#1769FF" />
                <Text style={styles.vehicleSelectorText} numberOfLines={1} ellipsizeMode="tail">
                  {displayVehicle ? `${displayVehicle.type} - ${displayVehicle.name}` : 'Car - Honda'}
                </Text>
                <ChevronDownIcon color="#1769FF" />
              </AnimatedPressableCard>

              <AnimatedPressableCard
                style={styles.settingsCircleBtn}
                onPress={navigateToSettings}
                scaleTo={0.9}
                accessibilityLabel="Settings">
                <SettingsIcon color="#101828" />
              </AnimatedPressableCard>
            </View>
          </View>
        </Animated.View>

        {/* Loading Skeleton State or Content */}
        {isLoading || !displayVehicle ? (
          <DashboardSkeleton />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 35 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1769FF"
                colors={['#1769FF']}
              />
            }>
            {/* 2. Vehicle Hero Card */}
            <Animated.View entering={FadeInUp.duration(300).delay(60)}>
              <VehicleOverviewCard
                vehicleName={displayVehicle.name}
                category={displayVehicle.type}
                modelDetails={displayVehicle.model}
                registrationNumber={displayVehicle.regNumber}
                odometer={displayVehicle.odometer}
                fuelType={displayVehicle.fuelType}
                photoUrl={displayVehicle.photoUrl}
                onEditPress={() => {
                  setNewOdometer(displayVehicle.odometer.toString());
                  setOdoError(null);
                  setOdoModalVisible(true);
                }}
              />
            </Animated.View>

            {/* 3. Quick Actions Row */}
            <Animated.View entering={FadeInUp.duration(300).delay(120)}>
              <QuickActionsRow
                onAddService={() => setServiceModalVisible(true)}
                onAddExpense={() => setExpenseModalVisible(true)}
                onAddDocument={() => setDocModalVisible(true)}
              />
            </Animated.View>

            {/* 4. Alerts, 2x2 Status Grid & Financial Summary */}
            <Animated.View entering={FadeInUp.duration(300).delay(180)}>
              <StatusGrid
                activeVehicle={displayVehicle.raw}
                onAnalyticsPress={() => router.push('/(tabs)/analytics' as any)}
                onAlertPress={() => setDocModalVisible(true)}
                onNextServicePress={() => setServiceModalVisible(true)}
                onInsurancePress={() => setDocModalVisible(true)}
                onPucPress={() => setDocModalVisible(true)}
                refreshTrigger={docRefreshKey}
                onRefreshNeeded={() => setDocRefreshKey((k) => k + 1)}
              />
            </Animated.View>
          </ScrollView>
        )}

        {/* Action Modals */}
        {displayVehicle && (
          <>
            <AddServiceModal
              visible={serviceModalVisible}
              onClose={() => setServiceModalVisible(false)}
              currentOdometer={displayVehicle.odometer}
              onSave={(data) => {
                if (data?.odometer && data.odometer > displayVehicle.odometer && contextVehicle) {
                  setContextVehicle({ ...contextVehicle, current_odometer: data.odometer });
                }
                dataCache.clear();
                setDocRefreshKey((k) => k + 1);
              }}
            />

            <AddExpenseModal
              visible={expenseModalVisible}
              onClose={() => setExpenseModalVisible(false)}
              onSave={(_data) => {
                dataCache.clear();
                setDocRefreshKey((k) => k + 1);
              }}
            />

            <AddDocumentModal
              visible={docModalVisible}
              onClose={() => setDocModalVisible(false)}
              vehicleId={displayVehicle.id}
              onSave={(_doc) => {
                dataCache.clear();
                setDocRefreshKey((k) => k + 1);
              }}
            />
          </>
        )}

        {/* Vehicle Switcher Bottom Sheet / Modal */}
        <Modal visible={switcherVisible} transparent animationType="none">
          <Animated.View entering={FadeIn.duration(180)} style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSwitcherVisible(false)}
            />
            <Animated.View entering={ZoomIn.duration(200)} style={[styles.modalBox, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Vehicle</Text>
              <Text style={styles.modalSubtitle}>Choose a vehicle to update dashboard statistics</Text>

              {vehicles && vehicles.length > 0 ? (
                vehicles.map((v) => {
                  const isSelected = contextVehicle?.id === v.id;
                  return (
                    <AnimatedPressableCard
                      key={v.id}
                      style={[
                        styles.modalVehicleItem,
                        isSelected && styles.modalVehicleItemActive,
                      ]}
                      onPress={() => {
                        setContextVehicle(v);
                        dataCache.clear();
                        setDocRefreshKey((k) => k + 1);
                        setSwitcherVisible(false);
                      }}
                      scaleTo={0.98}>
                      <View style={styles.vehicleItemLeft}>
                        <Text style={styles.vehicleItemTypeBadge}>
                          {v.type || 'Car'}
                        </Text>
                        <View style={{ flexShrink: 1 }}>
                          <Text style={[styles.modalVehicleName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {v.brand} {v.model}
                          </Text>
                          {v.registration_number ? (
                            <Text style={styles.vehicleItemReg} numberOfLines={1}>
                              {v.registration_number}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {isSelected && (
                          <Text style={styles.modalVehicleActiveCheck}>✓</Text>
                        )}
                        <TouchableOpacity
                          style={{
                            padding: 6,
                            borderRadius: 8,
                            backgroundColor: '#FEF2F2',
                          }}
                          onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert(
                              'Delete Vehicle',
                              `Are you sure you want to delete ${v.brand} ${v.model}? All associated records will be removed.`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    const ok = await deleteVehicle(v.id);
                                    if (ok) {
                                      dataCache.clear();
                                      setDocRefreshKey((k) => k + 1);
                                    } else {
                                      Alert.alert('Error', 'Could not delete vehicle. Please try again.');
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                          accessibilityLabel="Delete vehicle">
                          <TrashIcon color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </AnimatedPressableCard>
                  );
                })
              ) : displayVehicle ? (
                <View style={[styles.modalVehicleItem, styles.modalVehicleItemActive]}>
                  <Text style={[styles.modalVehicleName, { color: theme.textPrimary }]}>
                    {displayVehicle.type} - {displayVehicle.name}
                  </Text>
                  <Text style={styles.modalVehicleActiveCheck}>✓</Text>
                </View>
              ) : null}

              <AnimatedPressableCard
                style={styles.addVehicleBtn}
                onPress={() => {
                  setSwitcherVisible(false);
                  router.push('/vehicle/add' as any);
                }}
                scaleTo={0.96}>
                <Text style={styles.addVehicleBtnText}>+ Add New Vehicle</Text>
              </AnimatedPressableCard>
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Edit Odometer Modal */}
        <Modal visible={odoModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Update Odometer Reading</Text>
              <Text style={styles.modalSubtitle}>
                Enter updated odometer reading in kilometers
              </Text>

              {odoError ? (
                <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>{odoError}</Text>
                </View>
              ) : null}

              <TextInput
                style={styles.odoInput}
                value={newOdometer}
                onChangeText={setNewOdometer}
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                autoFocus
              />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setOdoModalVisible(false)}
                  disabled={odoSaving}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, odoSaving && { opacity: 0.6 }]}
                  onPress={handleUpdateOdometer}
                  disabled={odoSaving}>
                  <Text style={styles.modalSaveText}>{odoSaving ? 'Saving...' : 'Update'}</Text>
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
    backgroundColor: '#F5F8FC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },
  /* Header Area */
  headerContainer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F5F8FC',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleArea: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#101828',
    letterSpacing: -0.5,
  },
  dashboardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#667085',
    marginTop: 2,
  },
  rightHeaderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  vehicleSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    height: 38,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  vehicleSelectorText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1769FF',
    flexShrink: 1,
  },
  settingsCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  /* Scroll Area */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: SCREEN_PADDING,
  },
  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 26, 58, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#667085',
    marginBottom: 16,
  },
  modalVehicleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E4EAF2',
    marginBottom: 8,
  },
  modalVehicleItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1769FF',
    borderWidth: 1.5,
  },
  vehicleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  vehicleItemTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1769FF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalVehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#101828',
  },
  vehicleItemReg: {
    fontSize: 11,
    color: '#667085',
    marginTop: 1,
  },
  modalVehicleActiveCheck: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1769FF',
  },
  addVehicleBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addVehicleBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1769FF',
  },
  odoInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#1769FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1769FF',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
