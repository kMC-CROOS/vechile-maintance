import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import Svg, { Path } from 'react-native-svg';
import { VehicleCategoryCardsAnimated } from '@/components/ui/VehicleCategoryCardsAnimated';
import { DatePickerField } from '@/components/ui/DatePickerField';

// Available vehicle types
const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter', 'Truck'] as const;
type VehicleType = (typeof VEHICLE_TYPES)[number];

// Available fuel types
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'] as const;
type FuelType = (typeof FUEL_TYPES)[number];

// Back Arrow SVG Icon
const BackIcon = ({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function AddVehicleScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();

  // Form States
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [nickname, setNickname] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
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

  /**
   * Save Vehicle Handler:
   * 1. Validates required fields
   * 2. Packages newly created vehicle data
   * 3. Immediately navigates to the Dashboard screen passing the vehicle state
   */
  const handleSave = () => {
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

    // 2. Build newly saved vehicle object
    const newVehicle = {
      id: Date.now().toString(),
      name: nickname.trim() || model.trim(),
      type: vehicleType,
      vehicleType,
      brand: brand.trim(),
      model: `${brand.trim()} ${model.trim()}`,
      regNumber: registrationNumber.trim().toUpperCase(),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      odometer: 1500,
      current_odometer: 1500,
      fuelType,
      insurance: {
        expiryDate: insuranceExpiryDate.trim() || undefined,
        notification: insuranceNotification,
        alarm: insuranceAlarm,
      },
      puc: {
        expiryDate: pucExpiryDate.trim() || undefined,
        notification: pucNotification,
        alarm: pucAlarm,
      },
      notes: notes.trim() || undefined,
    };

    console.log('Saved vehicle, navigating to Dashboard:', newVehicle);

    // 3. Immediate navigation to Dashboard screen
    try {
      // If stack navigation reset is available, reset stack to Dashboard so back button won't return to Add Vehicle
      if (navigation.reset) {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: '(tabs)',
              params: {
                screen: 'index',
                params: { newVehicle: JSON.stringify(newVehicle) },
              },
            },
          ],
        });
      } else if (navigation.navigate) {
        navigation.navigate('Dashboard', { newVehicle });
      } else {
        router.replace({
          pathname: '/(tabs)',
          params: { newVehicle: JSON.stringify(newVehicle) },
        });
      }
    } catch (err) {
      router.replace({
        pathname: '/(tabs)',
        params: { newVehicle: JSON.stringify(newVehicle) },
      });
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
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as any))}
            accessibilityLabel="Go back"
            accessibilityRole="button">
            <BackIcon />
          </TouchableOpacity>
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
            <View style={styles.inputGroupLast}>
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
              <DatePickerField
                value={insuranceExpiryDate}
                onChangeText={setInsuranceExpiryDate}
                placeholder="Select Insurance Expiry Date"
                wrapperStyle={[styles.dateInputWrapper, focusedField === 'insuranceDate' && styles.inputFocused]}
                onFocus={() => setFocusedField('insuranceDate')}
                onBlur={() => setFocusedField(null)}
              />
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
              <DatePickerField
                value={pucExpiryDate}
                onChangeText={setPucExpiryDate}
                placeholder="Select PUC Expiry Date"
                wrapperStyle={[styles.dateInputWrapper, focusedField === 'pucDate' && styles.inputFocused]}
                onFocus={() => setFocusedField('pucDate')}
                onBlur={() => setFocusedField(null)}
              />
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
});
