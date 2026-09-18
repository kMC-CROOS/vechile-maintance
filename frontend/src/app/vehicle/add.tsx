import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { VehicleCategoryCardsAnimated } from '@/components/ui/VehicleCategoryCardsAnimated';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

// Available vehicle types
const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter', 'Truck'] as const;
type VehicleType = (typeof VEHICLE_TYPES)[number];

// Available fuel types
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'] as const;
type FuelType = (typeof FUEL_TYPES)[number];

// Reusable Calendar SVG Icon
const CalendarIcon = ({ color = '#64748B', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
    <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Back Arrow SVG Icon
const BackIcon = ({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Chevron Left SVG Icon
const ChevronLeftIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Chevron Right SVG Icon
const ChevronRightIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function AddVehicleScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { vehicles, reloadVehicles } = useVehicle();
  const { logout } = useAuth();

  // Form States
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [nickname, setNickname] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');

  // Expiry & Notification States
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [insuranceNotification, setInsuranceNotification] = useState(true);
  const [insuranceAlarm, setInsuranceAlarm] = useState(false);

  const [pucExpiryDate, setPucExpiryDate] = useState('');
  const [pucNotification, setPucNotification] = useState(true);
  const [pucAlarm, setPucAlarm] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Focus tracking for input highlights
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Interactive Calendar Date Picker States
  const [activeDatePickerTarget, setActiveDatePickerTarget] = useState<'insurance' | 'puc' | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(new Date());

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calendar Helpers
  const currentMonthYear = useMemo(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;
  }, [calendarCursor]);

  const calendarDays = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, dateStr: '', isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({ day: d, dateStr: `${year}-${mm}-${dd}`, isCurrentMonth: true });
    }
    return days;
  }, [calendarCursor]);

  const openCalendarFor = (target: 'insurance' | 'puc', e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setActiveDatePickerTarget(target);
    const currentDateVal = target === 'insurance' ? insuranceExpiryDate : pucExpiryDate;
    if (currentDateVal && /^\d{4}-\d{2}-\d{2}$/.test(currentDateVal.trim())) {
      const [y, m, d] = currentDateVal.trim().split('-').map(Number);
      setCalendarCursor(new Date(y, m - 1, d || 1));
    } else {
      setCalendarCursor(new Date());
    }
    setShowCalendar(true);
  };

  const handlePrevMonth = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1));
  };

  const handleNextMonth = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1));
  };

  const handleSelectDate = (dateStr: string, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (activeDatePickerTarget === 'insurance') {
      setInsuranceExpiryDate(dateStr);
    } else if (activeDatePickerTarget === 'puc') {
      setPucExpiryDate(dateStr);
    }
    setShowCalendar(false);
  };

  /**
   * Save Vehicle Handler:
   * 1. Validates required fields
   * 2. Persists newly created vehicle to backend API
   * 3. Reloads vehicles in VehicleContext
   * 4. Immediately routes to the Dashboard screen via router.replace()
   */
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    // 1. Validation
    if (!brand.trim()) {
      Alert.alert('Required Field', 'Please enter the vehicle Brand / Make (e.g. Mahindra, Honda)');
      return;
    }
    if (!model.trim()) {
      Alert.alert('Required Field', 'Please enter the vehicle Model (e.g. XUV700, City)');
      return;
    }
    if (!registrationNumber.trim()) {
      Alert.alert('Required Field', 'Please enter the Registration Number (e.g. MH 12 AB 1234)');
      return;
    }

    setLoading(true);

    try {
      const odoNum = parseFloat(odometer.replace(/[^0-9.]/g, '')) || 0;
      const created = await apiFetch<Vehicle>('/vehicles', {
        method: 'POST',
        body: {
          type: vehicleType,
          brand: brand.trim(),
          model: model.trim(),
          registration_number: registrationNumber.trim().toUpperCase(),
          fuel_type: fuelType,
          transmission: 'Manual',
          current_odometer: odoNum,
          notes: notes.trim() || undefined,
          insurance_expiry_date: insuranceExpiryDate.trim() || undefined,
        },
      });

      // Reload vehicles and select the newly created vehicle
      await reloadVehicles(created?.id);

      // Route to Home Dashboard for the newly created vehicle
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Unable to save vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* 1. Header Navigation Bar */}
        <View style={styles.header}>
          {vehicles.length > 0 ? (
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button">
              <BackIcon />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={logout}
              accessibilityLabel="Sign out"
              accessibilityRole="button">
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Add Vehicle</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Scrollable Form Container */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* 2. Vehicle Type Section (Animated Rich Image Cards) */}
          <View style={styles.card}>
            <VehicleCategoryCardsAnimated
              label="Vehicle Type"
              selectedCategory={vehicleType}
              onSelectCategory={(item) => setVehicleType(item.value as any)}
            />
          </View>

          {/* 3. Text Input Fields Section */}
          <View style={styles.card}>
            {/* Vehicle Nickname */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Nickname</Text>
              <TextInput
                style={[styles.input, focusedField === 'nickname' && styles.inputFocused]}
                placeholder="e.g. Primary SUV"
                placeholderTextColor="#94A3B8"
                value={nickname}
                onChangeText={setNickname}
                onFocus={() => setFocusedField('nickname')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>

            {/* Brand / Make */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Brand / Make <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, focusedField === 'brand' && styles.inputFocused]}
                placeholder="e.g. Mahindra, Honda"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
                onFocus={() => setFocusedField('brand')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>

            {/* Model */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Model <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, focusedField === 'model' && styles.inputFocused]}
                placeholder="e.g. XUV700, City"
                placeholderTextColor="#94A3B8"
                value={model}
                onChangeText={setModel}
                onFocus={() => setFocusedField('model')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>

            {/* Registration Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Registration Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, focusedField === 'regNo' && styles.inputFocused]}
                placeholder="e.g. MH 12 AB 1234"
                placeholderTextColor="#94A3B8"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                onFocus={() => setFocusedField('regNo')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="characters"
              />
            </View>

            {/* Current Odometer */}
            <View style={styles.inputGroupLast}>
              <Text style={styles.inputLabel}>Current Odometer (km)</Text>
              <TextInput
                style={[styles.input, focusedField === 'odometer' && styles.inputFocused]}
                placeholder="e.g. 1500"
                placeholderTextColor="#94A3B8"
                value={odometer}
                onChangeText={setOdometer}
                onFocus={() => setFocusedField('odometer')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 4. Fuel Type Section */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Fuel Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContainer}>
              {FUEL_TYPES.map((fuel) => {
                const isSelected = fuelType === fuel;
                return (
                  <TouchableOpacity
                    key={fuel}
                    activeOpacity={0.8}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => setFuelType(fuel)}>
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {fuel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 5. Expiry & Notification Settings Section */}
          <View style={styles.card}>
            <Text style={styles.cardSectionHeader}>Expiry & Notification Settings</Text>

            {/* Insurance Expiry Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Insurance Expiry Date</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.dateInputWrapper,
                  activeDatePickerTarget === 'insurance' && showCalendar && styles.inputFocused,
                ]}
                onPress={(e) => openCalendarFor('insurance', e)}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="Select Insurance Expiry Date"
                  placeholderTextColor="#94A3B8"
                  value={insuranceExpiryDate}
                  editable={false}
                  pointerEvents="none"
                />
                <View style={styles.calendarIconContainer}>
                  <CalendarIcon color="#2563EB" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Insurance Expiry Notification Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrapper}>
                <Text style={styles.toggleTitle}>Insurance Expiry Notification</Text>
                <Text style={styles.toggleSubtext}>
                  Get standard banner alert on insurance expiry date & time
                </Text>
              </View>
              <Switch
                value={insuranceNotification}
                onValueChange={setInsuranceNotification}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={insuranceNotification ? '#2563EB' : '#FFFFFF'}
                ios_backgroundColor="#CBD5E1"
              />
            </View>

            {/* Insurance Expiry Native Alarm Toggle */}
            <View style={[styles.toggleRow, styles.toggleDivider]}>
              <View style={styles.toggleTextWrapper}>
                <Text style={styles.toggleTitle}>Insurance Expiry Native Alarm</Text>
                <Text style={styles.toggleSubtext}>
                  Trigger full alarm sound on insurance expiry date & time
                </Text>
              </View>
              <Switch
                value={insuranceAlarm}
                onValueChange={setInsuranceAlarm}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={insuranceAlarm ? '#2563EB' : '#FFFFFF'}
                ios_backgroundColor="#CBD5E1"
              />
            </View>

            {/* PUC Expiry Date */}
            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <Text style={styles.inputLabel}>PUC Expiry Date</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.dateInputWrapper,
                  activeDatePickerTarget === 'puc' && showCalendar && styles.inputFocused,
                ]}
                onPress={(e) => openCalendarFor('puc', e)}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="Select PUC Expiry Date"
                  placeholderTextColor="#94A3B8"
                  value={pucExpiryDate}
                  editable={false}
                  pointerEvents="none"
                />
                <View style={styles.calendarIconContainer}>
                  <CalendarIcon color="#2563EB" />
                </View>
              </TouchableOpacity>
            </View>

            {/* PUC Expiry Notification Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrapper}>
                <Text style={styles.toggleTitle}>PUC Expiry Notification</Text>
                <Text style={styles.toggleSubtext}>
                  Get standard banner alert on PUC expiry date & time
                </Text>
              </View>
              <Switch
                value={pucNotification}
                onValueChange={setPucNotification}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={pucNotification ? '#2563EB' : '#FFFFFF'}
                ios_backgroundColor="#CBD5E1"
              />
            </View>

            {/* PUC Expiry Native Alarm Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrapper}>
                <Text style={styles.toggleTitle}>PUC Expiry Native Alarm</Text>
                <Text style={styles.toggleSubtext}>
                  Trigger full alarm sound on PUC expiry date & time
                </Text>
              </View>
              <Switch
                value={pucAlarm}
                onValueChange={setPucAlarm}
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={pucAlarm ? '#2563EB' : '#FFFFFF'}
                ios_backgroundColor="#CBD5E1"
              />
            </View>
          </View>

          {/* 6. Notes Section */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={[styles.notesInput, focusedField === 'notes' && styles.inputFocused]}
              placeholder="Additional specs..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* 7. Footer Button */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={loading}>
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving Vehicle...' : 'Save Vehicle'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Calendar Date Picker Modal */}
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModalContent}>
              {/* Header: Title & Navigation */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.calNavBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous month">
                  <ChevronLeftIcon />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.calendarModalTargetText}>
                    {activeDatePickerTarget === 'insurance'
                      ? 'Select Insurance Expiry'
                      : 'Select PUC Expiry'}
                  </Text>
                  <Text style={styles.calendarMonthTitle}>{currentMonthYear}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.calNavBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Next month">
                  <ChevronRightIcon />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.calWeekRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                  <Text key={w} style={styles.calWeekDayText}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.calDaysGrid}>
                {calendarDays.map((d, index) => {
                  if (!d.isCurrentMonth) {
                    return <View key={`empty-${index}`} style={styles.calDayCell} />;
                  }
                  const activeVal =
                    activeDatePickerTarget === 'insurance'
                      ? insuranceExpiryDate
                      : pucExpiryDate;
                  const isSelected = activeVal === d.dateStr;
                  const isToday = todayStr === d.dateStr;
                  return (
                    <TouchableOpacity
                      key={d.dateStr}
                      style={[
                        styles.calDayCell,
                        isSelected && styles.calDayCellSelected,
                        isToday && !isSelected && styles.calDayCellToday,
                      ]}
                      activeOpacity={0.7}
                      onPress={(e) => handleSelectDate(d.dateStr, e)}>
                      <Text
                        style={[
                          styles.calDayText,
                          isSelected && styles.calDayTextSelected,
                          isToday && !isSelected && styles.calDayTextToday,
                        ]}>
                        {d.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Footer Quick Actions */}
              <View style={styles.calFooter}>
                <TouchableOpacity
                  style={styles.calTodayBtn}
                  activeOpacity={0.7}
                  onPress={(e) => handleSelectDate(todayStr, e)}>
                  <Text style={styles.calTodayBtnText}>Select Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calCloseBtn}
                  activeOpacity={0.7}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    e?.stopPropagation?.();
                    setShowCalendar(false);
                  }}>
                  <Text style={styles.calCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 40,
  },

  /* Scrollable Content */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  /* Card Containers */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Soft subtle shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -0.1,
  },

  /* Section Labels */
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },

  /* Pills Selection (Vehicle Type & Fuel Type) */
  pillsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },

  /* Input Fields */
  inputGroup: {
    marginBottom: 14,
  },
  inputGroupLast: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  inputFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
  },

  /* Date Input with Calendar Icon */
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  dateInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 0,
  },
  calendarIconContainer: {
    paddingLeft: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Toggles Section */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  toggleTextWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  /* Notes */
  notesInput: {
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },

  /* Footer Button */
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Calendar Date Picker Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarModalTargetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  calWeekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calDayCell: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  calDayCellSelected: {
    backgroundColor: '#2563EB',
  },
  calDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  calDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calDayTextToday: {
    color: '#2563EB',
    fontWeight: '700',
  },
  calFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calTodayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  calTodayBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  calCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  calCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
