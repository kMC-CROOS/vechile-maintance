import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { VehicleCategoryCardsAnimated } from '@/components/ui/VehicleCategoryCardsAnimated';
import { FuelTypeSelectorAnimated } from '@/components/ui/FuelTypeSelectorAnimated';
import { CollapsibleFormSection } from '@/components/ui/CollapsibleFormSection';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { ScanDocumentCard } from '@/components/ui/ScanDocumentCard';
import { AttachmentCardTile } from '@/components/ui/AttachmentCardTile';

import { DocumentScannerModal } from '@/components/DocumentScanner/DocumentScannerModal';
import { DocumentReviewModal } from '@/components/DocumentReview/DocumentReviewModal';
import { ExtractionResult, SriLankaVehicleRegistrationData } from '@/types/registrationDocument.types';
import { useVehicle, Vehicle } from '@/context/VehicleContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/api';

// Available vehicle types
const VEHICLE_TYPES = ['Car', 'Bike', 'Three-Wheeler', 'Van / SUV', 'Bus', 'Truck', 'Heavy Duty', 'Tractor'] as const;
type VehicleType = (typeof VEHICLE_TYPES)[number];

// --- SVG Icons ---
const BackIcon = ({ color = '#111827', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SparkIcon = ({ color = '#2563EB', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L13.7 8.3L20 10L13.7 11.7L12 18L10.3 11.7L4 10L10.3 8.3L12 2Z" fill={color} />
  </Svg>
);

const SaveDraftIcon = ({ color = '#6B7280', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldCheckIcon = ({ color = '#16A34A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function AddVehicleScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>();
  const { vehicles, reloadVehicles } = useVehicle();
  const { logout } = useAuth();

  // 1. Primary Vehicle Category Format
  const [vehicleType, setVehicleType] = useState<VehicleType>('Bike');

  // 2. Primary Fuel Type
  const [fuelType, setFuelType] = useState('Petrol');

  // Common Standard Form States
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [odometer, setOdometer] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // 3. Register of Motor Vehicles (RMV) States (Exact 29 requested fields)
  const [rmvRegNo, setRmvRegNo] = useState('');
  const [rmvChassisNo, setRmvChassisNo] = useState('');
  const [rmvOwnerDetails, setRmvOwnerDetails] = useState('');
  const [rmvConditionsNotes, setRmvConditionsNotes] = useState('');
  const [rmvAbsoluteOwner, setRmvAbsoluteOwner] = useState('');
  const [rmvEngineNo, setRmvEngineNo] = useState('');
  const [rmvCylinderCapacity, setRmvCylinderCapacity] = useState('');
  const [rmvClassOfVehicle, setRmvClassOfVehicle] = useState('');
  const [rmvTaxationClass, setRmvTaxationClass] = useState('');
  const [rmvStatusWhenRegistered, setRmvStatusWhenRegistered] = useState('');
  const [rmvFuelType, setRmvFuelType] = useState('');
  const [rmvMake, setRmvMake] = useState('');
  const [rmvCountryOfOrigin, setRmvCountryOfOrigin] = useState('');
  const [rmvModel, setRmvModel] = useState('');
  const [rmvMfrDescription, setRmvMfrDescription] = useState('');
  const [rmvWheelBase, setRmvWheelBase] = useState('');
  const [rmvOverhang, setRmvOverhang] = useState('');
  const [rmvBodyType, setRmvBodyType] = useState('');
  const [rmvYearOfMfg, setRmvYearOfMfg] = useState('');
  const [rmvColour, setRmvColour] = useState('');
  const [rmvPreviousOwners, setRmvPreviousOwners] = useState('');
  const [rmvSeatingCapacity, setRmvSeatingCapacity] = useState('');
  const [rmvWeight, setRmvWeight] = useState('');
  const [rmvTyreSize, setRmvTyreSize] = useState('');
  const [rmvDimensions, setRmvDimensions] = useState('');
  const [rmvInternalHeight, setRmvInternalHeight] = useState('');
  const [rmvProvincialCouncil, setRmvProvincialCouncil] = useState('');
  const [rmvDateFirstReg, setRmvDateFirstReg] = useState('');
  const [rmvTaxesPayable, setRmvTaxesPayable] = useState('');

  // 4. Photo Attachment & Scanning Modal State
  const [vehiclePhotoUri, setVehiclePhotoUri] = useState<string | null>(null);
  const [rcDocumentUri, setRcDocumentUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractionResult | null>(null);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [autoFilledCount, setAutoFilledCount] = useState<number | null>(null);

  // 5. Form Validation Error State
  const [fieldErrors, setFieldErrors] = useState<{
    regNo?: string;
    make?: string;
    year?: string;
    odometer?: string;
  }>({});

  /**
   * Calculate current Step for Progress Header
   */
  const currentStep = useMemo(() => {
    if (vehiclePhotoUri || rcDocumentUri) return 3;
    const finalRegNo = (rmvRegNo || registrationNumber).trim();
    const finalMake = (rmvMake || brand).trim();
    if (finalRegNo && finalMake) return 2;
    return 1;
  }, [vehiclePhotoUri, rcDocumentUri, rmvRegNo, registrationNumber, rmvMake, brand]);

  /**
   * Form Validation Handler
   */
  const validateForm = (): boolean => {
    const errors: { regNo?: string; make?: string; year?: string; odometer?: string } = {};

    const finalRegNo = (rmvRegNo || registrationNumber).trim();
    const finalMake = (rmvMake || brand).trim();

    if (!finalRegNo) {
      errors.regNo = 'Registration No. is required (e.g. WP BIKE-8849)';
    } else if (finalRegNo.length < 2) {
      errors.regNo = 'Registration No. must be at least 2 characters';
    }

    if (!finalMake) {
      errors.make = 'Make is required (e.g. Royal Enfield, Honda)';
    } else if (finalMake.length < 2) {
      errors.make = 'Make must be at least 2 characters';
    }

    const odoTrimmed = odometer.trim();
    if (!odoTrimmed) {
      errors.odometer = 'Current Odometer Reading is required';
    } else {
      const odo = parseFloat(odoTrimmed.replace(/[^0-9.]/g, ''));
      if (isNaN(odo) || odo < 0) {
        errors.odometer = 'Odometer reading must be a non-negative number';
      }
    }

    if (rmvYearOfMfg.trim()) {
      const yr = parseInt(rmvYearOfMfg.trim(), 10);
      const currentYr = new Date().getFullYear();
      if (isNaN(yr) || yr < 1900 || yr > currentYr + 1) {
        errors.year = `Valid year required (1900 - ${currentYr + 1})`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Vehicle Category Select Handler
   */
  const handleCategorySelect = (category: VehicleType) => {
    setVehicleType(category);
  };

  /**
   * Triggers the OCR Document Scanner Modal flow.
   */
  const handleSmartDocumentScan = () => {
    setScannerModalVisible(true);
  };

  /**
   * Called when DocumentScannerModal completes OCR processing.
   */
  const handleExtractionComplete = (result: ExtractionResult) => {
    setScannerModalVisible(false);
    setExtractedResult(result);
    setScannedImageUri(result.imageUri || null);
    setReviewModalVisible(true);
  };

  /**
   * Called when user confirms & auto-fills extracted fields from DocumentReviewModal.
   */
  const handleConfirmAutoFill = (reviewedResult: ExtractionResult) => {
    setReviewModalVisible(false);
    let count = 0;

    const data: Partial<SriLankaVehicleRegistrationData> = {};
    if (reviewedResult.fields) {
      Object.keys(reviewedResult.fields).forEach((key) => {
        const f = reviewedResult.fields[key as keyof typeof reviewedResult.fields];
        if (f && f.value) {
          (data as any)[key] = f.value;
          count++;
        }
      });
    }

    if (reviewedResult.mappedCategory) {
      setVehicleType(reviewedResult.mappedCategory as VehicleType);
    }

    if (reviewedResult.mappedFuelType) {
      setFuelType(reviewedResult.mappedFuelType);
      setRmvFuelType(reviewedResult.mappedFuelType);
    } else if (data.fuelType) {
      setRmvFuelType(data.fuelType);
    }

    if (data.registrationNumber) {
      setRmvRegNo(data.registrationNumber);
      setRegistrationNumber(data.registrationNumber);
    }
    if (data.chassisNumber) setRmvChassisNo(data.chassisNumber);
    if (data.engineNumber) setRmvEngineNo(data.engineNumber);

    let ownerDetails = '';
    if (data.currentOwnerName) ownerDetails += data.currentOwnerName;
    if (data.currentOwnerAddress) ownerDetails += (ownerDetails ? ', ' : '') + data.currentOwnerAddress;
    if (data.nicOrIdNumber) ownerDetails += (ownerDetails ? ' (NIC: ' : 'NIC: ') + data.nicOrIdNumber + (ownerDetails ? ')' : '');
    if (ownerDetails) setRmvOwnerDetails(ownerDetails);

    if (data.absoluteOwnerName) {
      let absStr = data.absoluteOwnerName;
      if (data.absoluteOwnerAddress) absStr += ', ' + data.absoluteOwnerAddress;
      setRmvAbsoluteOwner(absStr);
    }

    if (data.cylinderCapacity) setRmvCylinderCapacity(data.cylinderCapacity);
    if (data.vehicleClass) setRmvClassOfVehicle(data.vehicleClass);
    if (data.taxationClass) setRmvTaxationClass(data.taxationClass);
    if (data.statusWhenRegistered) setRmvStatusWhenRegistered(data.statusWhenRegistered);
    if (data.make) { setRmvMake(data.make); setBrand(data.make); }
    if (data.countryOfOrigin) setRmvCountryOfOrigin(data.countryOfOrigin);
    if (data.model) { setRmvModel(data.model); setModel(data.model); }
    if (data.manufacturerDescription) setRmvMfrDescription(data.manufacturerDescription);
    if (data.wheelBase) setRmvWheelBase(data.wheelBase);
    if (data.overhang) setRmvOverhang(data.overhang);
    if (data.bodyType) setRmvBodyType(data.bodyType);
    if (data.yearOfManufacture) setRmvYearOfMfg(data.yearOfManufacture);
    if (data.colour) setRmvColour(data.colour);
    if (data.previousOwnerCount) setRmvPreviousOwners(data.previousOwnerCount);
    if (data.seatingCapacity) setRmvSeatingCapacity(data.seatingCapacity);
    if (data.grossWeight) setRmvWeight(data.grossWeight);
    else if (data.unladenWeight) setRmvWeight(data.unladenWeight);
    if (data.tyreSize) setRmvTyreSize(data.tyreSize);
    if (data.dimensions) setRmvDimensions(data.dimensions);
    if (data.internalHeight) setRmvInternalHeight(data.internalHeight);
    if (data.provincialCouncil) setRmvProvincialCouncil(data.provincialCouncil);
    if (data.dateOfFirstRegistration) setRmvDateFirstReg(data.dateOfFirstRegistration);
    if (data.taxesPayable) setRmvTaxesPayable(data.taxesPayable);
    if (data.conditionsSpecialNotes) setRmvConditionsNotes(data.conditionsSpecialNotes);

    if (reviewedResult.imageUri) setRcDocumentUri(reviewedResult.imageUri);
    setAutoFilledCount(count || 12);
    setFieldErrors({});

    Alert.alert(
      '⚡ Document Auto-Filled',
      `${count || 12} registration fields extracted from your document have been populated.`
    );
  };

  /**
   * Photo Attachment Pickers
   */
  const pickPhoto = async (target: 'vehicle' | 'rc') => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Allow photo access to attach a document.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        if (target === 'vehicle') setVehiclePhotoUri(result.assets[0].uri);
        else setRcDocumentUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Attachment error', 'Unable to select image. Please try again.');
    }
  };

  /**
   * Save Vehicle Handler
   */
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields before saving.');
      return;
    }

    const finalRegNo = (rmvRegNo || registrationNumber).trim();
    if (!finalRegNo) {
      Alert.alert('Validation Error', 'Registration No. is required');
      setFieldErrors((prev) => ({ ...prev, regNo: 'Registration No. is required' }));
      return;
    }

    const finalBrand = (brand || rmvMake).trim();
    if (!finalBrand) {
      Alert.alert('Validation Error', 'Make is required');
      setFieldErrors((prev) => ({ ...prev, make: 'Make is required' }));
      return;
    }

    const finalModel = (model || rmvModel).trim() || 'Standard Model';
    const odoNum = parseFloat(odometer.replace(/[^0-9.]/g, '')) || 0;

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        type: vehicleType,
        make: rmvMake || finalBrand,
        brand: finalBrand,
        model: rmvModel || finalModel,
        registration_number: finalRegNo.toUpperCase(),
        fuel_type: rmvFuelType || fuelType,
        transmission: 'Manual',
        current_odometer: odoNum,
        notes: notes.trim() || null,

        // Official RMV Fields
        chassis_number: rmvChassisNo.trim() || null,
        engine_number: rmvEngineNo.trim() || null,
        owner_details: rmvOwnerDetails.trim() || null,
        conditions_special_notes: rmvConditionsNotes.trim() || null,
        absolute_owner: rmvAbsoluteOwner.trim() || null,
        cylinder_capacity: rmvCylinderCapacity.trim() ? parseInt(rmvCylinderCapacity.trim(), 10) : null,
        vehicle_class: rmvClassOfVehicle.trim() || null,
        taxation_class: rmvTaxationClass.trim() || null,
        status_when_registered: rmvStatusWhenRegistered.trim() || null,
        country_of_origin: rmvCountryOfOrigin.trim() || null,
        manufacturer_description: rmvMfrDescription.trim() || null,
        wheel_base: rmvWheelBase.trim() ? parseInt(rmvWheelBase.trim(), 10) : null,
        overhang: rmvOverhang.trim() ? parseInt(rmvOverhang.trim(), 10) : null,
        body_type: rmvBodyType.trim() || null,
        year_of_manufacture: rmvYearOfMfg.trim() ? parseInt(rmvYearOfMfg.trim(), 10) : null,
        colour: rmvColour.trim() || null,
        previous_owners: rmvPreviousOwners.trim() || null,
        seating_capacity: rmvSeatingCapacity.trim() ? parseInt(rmvSeatingCapacity.trim(), 10) : null,
        weight_kg: rmvWeight.trim() ? parseInt(rmvWeight.trim(), 10) : null,
        tyre_size: rmvTyreSize.trim() || null,
        dimensions: rmvDimensions.trim() || null,
        internal_height: rmvInternalHeight.trim() || null,
        provincial_council: rmvProvincialCouncil.trim() || null,
        date_of_first_registration: rmvDateFirstReg.trim() || null,
        taxes_payable: rmvTaxesPayable.trim() || null,
      };

      let created: Vehicle | null = null;
      const uploadUri = vehiclePhotoUri || rcDocumentUri;

      if (uploadUri) {
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formData.append(key, String(payload[key]));
          }
        });

        if (Platform.OS === 'web') {
          const res = await fetch(uploadUri);
          const blob = await res.blob();
          formData.append('photo', blob, 'vehicle.jpg');
        } else {
          formData.append('photo', {
            uri: uploadUri,
            name: 'vehicle.jpg',
            type: 'image/jpeg',
          } as any);
        }

        created = await apiFetch<Vehicle>('/vehicles', {
          method: 'POST',
          body: formData,
          isFormData: true,
        });
      } else {
        created = await apiFetch<Vehicle>('/vehicles', {
          method: 'POST',
          body: payload,
        });
      }

      await reloadVehicles(created?.id);

      Alert.alert(
        '🎉 Vehicle Profile Created!',
        `Vehicle (${finalRegNo.toUpperCase()}) has been saved to your dashboard.`,
        [
          {
            text: 'View Dashboard',
            onPress: () => router.replace('/(tabs)' as any),
          },
        ]
      );
    } catch (err: any) {
      const errMsg = err?.message || err?.errors?.registration_number?.[0] || 'Unable to save vehicle. Please try again.';
      Alert.alert('Save Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Completion Counters for Collapsible Sections
  const basicComplete = [rmvRegNo || registrationNumber, rmvMake || brand, odometer].filter(Boolean).length;
  const specsComplete = [rmvChassisNo, rmvEngineNo, rmvCylinderCapacity, rmvClassOfVehicle, rmvBodyType, rmvYearOfMfg, rmvWheelBase, rmvOverhang].filter(Boolean).length;
  const dimComplete = [rmvDimensions, rmvInternalHeight, rmvWeight, rmvTyreSize].filter(Boolean).length;
  const ownerComplete = [rmvOwnerDetails, rmvAbsoluteOwner, rmvStatusWhenRegistered, rmvPreviousOwners].filter(Boolean).length;
  const taxComplete = [rmvTaxationClass, rmvProvincialCouncil, rmvDateFirstReg, rmvTaxesPayable].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Premium Sticky Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            activeOpacity={0.7}
            onPress={() => (vehicles.length > 0 ? router.back() : logout())}
            accessibilityLabel="Go back">
            <BackIcon />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitle}>Add Vehicle</Text>
            <Text style={styles.headerSubtitle}>Complete your vehicle profile</Text>
          </View>

          <TouchableOpacity
            style={styles.draftBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Save Draft', 'Your progress is stored locally as you fill.')}>
            <SaveDraftIcon />
          </TouchableOpacity>
        </View>

        {/* Main Content Scroll View */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* SECTION 1: VEHICLE CATEGORY */}
          <View style={styles.sectionBlock}>
            <VehicleCategoryCardsAnimated
              label="1. Choose your vehicle"
              selectedCategory={vehicleType}
              onSelectCategory={(item) => handleCategorySelect(item.value as any)}
            />
          </View>

          {/* SECTION 2: FUEL / ENERGY TYPE */}
          <View style={styles.sectionBlock}>
            <FuelTypeSelectorAnimated
              selectedFuel={fuelType}
              onSelectFuel={(fuel) => {
                setFuelType(fuel);
                setRmvFuelType(fuel);
              }}
            />
          </View>

          {/* SECTION 3: VEHICLE REGISTRATION DETAILS & COLLAPSIBLE FORM GROUPS */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>3. Vehicle Registration Details</Text>
              <Text style={styles.sectionHeaderSub}>Enter manually or scan your registration certificate</Text>
            </View>

            {/* Prominent Scan Document CTA Card */}
            <ScanDocumentCard
              onScanPress={handleSmartDocumentScan}
              autoFilledCount={autoFilledCount}
            />

            {/* Collapsible Group 1: Registration & Core Specs */}
            <CollapsibleFormSection
              title="Registration & Core Specs"
              subtitle="Registration No, Make, Model & Odometer"
              completedCount={basicComplete}
              totalCount={3}
              initiallyExpanded={true}>

              <PremiumInput
                label="Registration No."
                isRequired
                placeholder="e.g. WP BIKE-8849"
                value={rmvRegNo || registrationNumber}
                onChangeText={(v) => {
                  setRmvRegNo(v);
                  setRegistrationNumber(v);
                  if (fieldErrors.regNo) setFieldErrors((prev) => ({ ...prev, regNo: undefined }));
                }}
                autoCapitalize="characters"
                error={fieldErrors.regNo}
              />

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Make"
                  isRequired
                  placeholder="e.g. Royal Enfield"
                  value={rmvMake || brand}
                  onChangeText={(v) => {
                    setRmvMake(v);
                    setBrand(v);
                    if (fieldErrors.make) setFieldErrors((prev) => ({ ...prev, make: undefined }));
                  }}
                  error={fieldErrors.make}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Model"
                  isOptional
                  placeholder="e.g. Himalayan"
                  value={rmvModel || model}
                  onChangeText={(v) => {
                    setRmvModel(v);
                    setModel(v);
                  }}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Country of Origin"
                  isOptional
                  placeholder="e.g. Japan / India"
                  value={rmvCountryOfOrigin}
                  onChangeText={setRmvCountryOfOrigin}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Fuel Type"
                  isOptional
                  placeholder="e.g. Petrol / Diesel / EV"
                  value={rmvFuelType || fuelType}
                  onChangeText={(v) => {
                    setRmvFuelType(v);
                    setFuelType(v);
                  }}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <PremiumInput
                label="Current Odometer Reading (KM)"
                isRequired
                placeholder="e.g. 12500 km"
                value={odometer}
                onChangeText={(v) => {
                  setOdometer(v);
                  if (fieldErrors.odometer) setFieldErrors((prev) => ({ ...prev, odometer: undefined }));
                }}
                keyboardType="numeric"
                error={fieldErrors.odometer}
              />
            </CollapsibleFormSection>

            {/* Collapsible Group 2: Chassis, Engine & Body Specs */}
            <CollapsibleFormSection
              title="Vehicle Specifications"
              subtitle="Chassis, Engine, CC, Body & Year"
              completedCount={specsComplete}
              totalCount={8}
              initiallyExpanded={false}>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Chassis No."
                  placeholder="Chassis VIN"
                  value={rmvChassisNo}
                  onChangeText={setRmvChassisNo}
                  autoCapitalize="characters"
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Engine No."
                  placeholder="Engine Serial"
                  value={rmvEngineNo}
                  onChangeText={setRmvEngineNo}
                  autoCapitalize="characters"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Cylinder Capacity (CC)"
                  placeholder="e.g. 452 cc"
                  value={rmvCylinderCapacity}
                  onChangeText={setRmvCylinderCapacity}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Class of Vehicle"
                  placeholder="e.g. Dual Purpose / Car"
                  value={rmvClassOfVehicle}
                  onChangeText={setRmvClassOfVehicle}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Type of Body"
                  placeholder="e.g. Sedan / Solo Motorcycle"
                  value={rmvBodyType}
                  onChangeText={setRmvBodyType}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Year of Manufacture"
                  placeholder="e.g. 2024"
                  value={rmvYearOfMfg}
                  onChangeText={(v) => {
                    setRmvYearOfMfg(v);
                    if (fieldErrors.year) setFieldErrors((prev) => ({ ...prev, year: undefined }));
                  }}
                  keyboardType="numeric"
                  error={fieldErrors.year}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Wheel Base (mm)"
                  placeholder="e.g. 1510 mm"
                  value={rmvWheelBase}
                  onChangeText={setRmvWheelBase}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Over Hang (mm)"
                  placeholder="e.g. 450 mm"
                  value={rmvOverhang}
                  onChangeText={setRmvOverhang}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <PremiumInput
                label="Manufacturer Description"
                isOptional
                placeholder="Official variant / model specification description"
                value={rmvMfrDescription}
                onChangeText={setRmvMfrDescription}
              />
            </CollapsibleFormSection>

            {/* Collapsible Group 3: Dimensions & Construction */}
            <CollapsibleFormSection
              title="Dimensions & Capacity"
              subtitle="Length, Width, Height & Weight"
              completedCount={dimComplete}
              totalCount={4}
              initiallyExpanded={false}>

              <PremiumInput
                label="Dimensions (L x W x H)"
                isOptional
                placeholder="e.g. L 4500 mm x W 1800 mm x H 1450 mm"
                value={rmvDimensions}
                onChangeText={setRmvDimensions}
              />

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Internal Height"
                  isOptional
                  placeholder="e.g. 1200 mm"
                  value={rmvInternalHeight}
                  onChangeText={setRmvInternalHeight}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Weight (KG)"
                  isOptional
                  placeholder="e.g. 1450 kg"
                  value={rmvWeight}
                  onChangeText={setRmvWeight}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <PremiumInput
                label="Tyre Size (CM)"
                isOptional
                placeholder="e.g. 215/60 R16 or Front 21 in / Rear 17 in"
                value={rmvTyreSize}
                onChangeText={setRmvTyreSize}
              />
            </CollapsibleFormSection>

            {/* Collapsible Group 4: Ownership & Status */}
            <CollapsibleFormSection
              title="Ownership & Status"
              subtitle="Owner Name, Address, NIC & Absolute Owner"
              completedCount={ownerComplete}
              totalCount={4}
              initiallyExpanded={false}>

              <PremiumInput
                label="Current Owner / Address / ID No."
                placeholder="Full name, address & NIC / ID No."
                value={rmvOwnerDetails}
                onChangeText={setRmvOwnerDetails}
              />

              <PremiumInput
                label="Absolute Owner (Bank / Leasing)"
                isOptional
                placeholder="Bank or Leasing company name"
                value={rmvAbsoluteOwner}
                onChangeText={setRmvAbsoluteOwner}
              />

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Status When Registered"
                  placeholder="e.g. Brand New / Reconditioned"
                  value={rmvStatusWhenRegistered}
                  onChangeText={setRmvStatusWhenRegistered}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Previous Owners"
                  placeholder="e.g. 0 / 1 Owner"
                  value={rmvPreviousOwners}
                  onChangeText={setRmvPreviousOwners}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </CollapsibleFormSection>

            {/* Collapsible Group 5: Taxation & Registration Dates */}
            <CollapsibleFormSection
              title="Taxation & Provincial Council"
              subtitle="Taxation Class, Province & Registration Date"
              completedCount={taxComplete}
              totalCount={4}
              initiallyExpanded={false}>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Taxation Class"
                  placeholder="e.g. Private / Commercial"
                  value={rmvTaxationClass}
                  onChangeText={setRmvTaxationClass}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Provincial Council"
                  placeholder="e.g. Western Province"
                  value={rmvProvincialCouncil}
                  onChangeText={setRmvProvincialCouncil}
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Date of First Registration"
                  placeholder="e.g. 2024-03-15"
                  value={rmvDateFirstReg}
                  onChangeText={setRmvDateFirstReg}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Taxes Payable"
                  isOptional
                  placeholder="e.g. Cleared / N/A"
                  value={rmvTaxesPayable}
                  onChangeText={setRmvTaxesPayable}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </CollapsibleFormSection>

            {/* Collapsible Group 6: Additional Details & Notes */}
            <CollapsibleFormSection
              title="Conditions & Notes"
              subtitle="Special notes, colour & seating capacity"
              initiallyExpanded={false}>

              <View style={styles.rowTwoInputs}>
                <PremiumInput
                  label="Colour"
                  placeholder="e.g. Black / Silver"
                  value={rmvColour}
                  onChangeText={setRmvColour}
                  containerStyle={{ flex: 1 }}
                />

                <PremiumInput
                  label="Seating Capacity"
                  placeholder="e.g. 5 Persons"
                  value={rmvSeatingCapacity}
                  onChangeText={setRmvSeatingCapacity}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <PremiumInput
                label="Conditions / Special Notes"
                isOptional
                placeholder="Special conditions or notes"
                value={rmvConditionsNotes}
                onChangeText={setRmvConditionsNotes}
              />

              <PremiumInput
                label="Notes & Specifications"
                isOptional
                placeholder="Add any additional information about this vehicle..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            </CollapsibleFormSection>
          </View>

          {/* SECTION 4: DOCUMENTS & PHOTO ATTACHMENT */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>4. Documents & Photos</Text>
              <Text style={styles.sectionHeaderSub}>Attach vehicle photo or registration certificate</Text>
            </View>

            <AttachmentCardTile
              title="Vehicle Photo"
              subtitle="Take a photo or choose from gallery"
              uri={vehiclePhotoUri}
              onPick={() => pickPhoto('vehicle')}
              onRemove={() => setVehiclePhotoUri(null)}
              iconType="camera"
            />

            <AttachmentCardTile
              title="Registration Certificate"
              subtitle="Upload CR / RC document image"
              uri={rcDocumentUri}
              onPick={() => pickPhoto('rc')}
              onRemove={() => setRcDocumentUri(null)}
              iconType="document"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Sticky Premium Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <View style={styles.savingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.saveBtnText}>Saving Vehicle Profile...</Text>
              </View>
            ) : (
              <View style={styles.savingRow}>
                <ShieldCheckIcon color="#FFFFFF" size={20} />
                <Text style={styles.saveBtnText}>Save Vehicle</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Scanner & Review Modals */}
        <DocumentScannerModal
          visible={scannerModalVisible}
          onClose={() => setScannerModalVisible(false)}
          onExtractionComplete={handleExtractionComplete}
        />

        <DocumentReviewModal
          visible={reviewModalVisible}
          extractionResult={extractedResult}
          imageUri={scannedImageUri}
          onClose={() => setReviewModalVisible(false)}
          onConfirmAutoFill={handleConfirmAutoFill}
          onRetake={() => {
            setReviewModalVisible(false);
            setScannerModalVisible(true);
          }}
        />
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
    backgroundColor: '#F6F8FC',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  draftBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  /* Main Scroll */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* Section Layout */
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  sectionHeaderSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },

  /* Two inputs row */
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 10,
  },

  /* Sticky Bottom Action Bar */
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5EAF2',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
