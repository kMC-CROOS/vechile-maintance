import React, { useState, useEffect } from 'react';
import {
  Modal,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { normalizeFuelType, normalizeVehicleCategory } from '../../utils/normalizeRegistrationDocumentData';
import Svg, { Path, Circle } from 'react-native-svg';
import { ExtractionResult, ExtractedField } from '../../types/registrationDocument.types';

export interface DocumentReviewModalProps {
  visible: boolean;
  extractionResult: ExtractionResult | null;
  imageUri?: string | null;
  onClose: () => void;
  onConfirmAutoFill: (reviewedData: ExtractionResult) => void;
  onRetake?: () => void;
}

const CheckCircleIcon = ({ size = 16, color = '#10B981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path d="M8 12l3 3 5-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WarningIcon = ({ size = 16, color = '#D97706' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  visible,
  extractionResult,
  imageUri,
  onClose,
  onConfirmAutoFill,
  onRetake,
}) => {
  const [editableFields, setEditableFields] = useState<Record<string, string>>({});
  const [acceptedFields, setAcceptedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (extractionResult && extractionResult.fields) {
      const initialMap: Record<string, string> = {};
      Object.keys(extractionResult.fields).forEach((key) => {
        const fieldKey = key as keyof typeof extractionResult.fields;
        initialMap[key] = extractionResult.fields[fieldKey]?.value || '';
      });
      setEditableFields(initialMap);
      setAcceptedFields({});
    }
  }, [extractionResult]);

  if (!extractionResult) return null;

  const handleFieldValueChange = (key: string, val: string) => {
    setEditableFields((prev) => ({ ...prev, [key]: val }));
    setAcceptedFields((prev) => ({ ...prev, [key]: Boolean(val.trim()) }));
  };

  const handleConfirm = () => {
    const updatedFields = { ...extractionResult.fields };
    Object.keys(editableFields).forEach((key) => {
      const fieldKey = key as keyof typeof updatedFields;
      if (updatedFields[fieldKey]) {
        updatedFields[fieldKey] = {
          ...updatedFields[fieldKey],
          value: acceptedFields[key] ? editableFields[key].trim() || null : null,
        };
      }
    });

    onConfirmAutoFill({
      ...extractionResult,
      fields: updatedFields,
      mappedCategory: normalizeVehicleCategory(updatedFields.vehicleClass?.value, updatedFields.bodyType?.value),
      mappedFuelType: normalizeFuelType(updatedFields.fuelType?.value),
    });
  };

  const renderFieldReviewInput = (
    key: string,
    label: string,
    extractedItem?: ExtractedField<string>
  ) => {
    const value = editableFields[key] || '';
    const confidence = extractedItem?.confidence || 0;
    const requiresReview = extractedItem?.requiresReview || confidence < 0.65;

    let badgeText = 'Detected - check document';
    let badgeBg = '#D1FAE5';
    let badgeColor = '#059669';
    let IconComponent = CheckCircleIcon;

    if (requiresReview || confidence < 0.65) {
      badgeText = '⚠ Please verify';
      badgeBg = '#FEF3C7';
      badgeColor = '#D97706';
      IconComponent = WarningIcon;
    } else if (confidence < 0.85) {
      badgeText = 'ℹ Medium';
      badgeBg = '#DBEAFE';
      badgeColor = '#2563EB';
    }

    return (
      <View style={styles.fieldCard} key={key}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: badgeBg }]}>
            <IconComponent size={12} color={badgeColor} />
            <Text style={[styles.confidenceBadgeText, { color: badgeColor }]}>{badgeText}</Text>
          </View>
        </View>

        <TextInput
          style={[styles.fieldInput, requiresReview && styles.fieldInputWarning]}
          value={value}
          onChangeText={(v) => handleFieldValueChange(key, v)}
          placeholder={`Enter ${label}`}
          placeholderTextColor="#94A3B8"
        />

        {value.trim() ? <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(acceptedFields[key]) }}
          onPress={() => setAcceptedFields((prev) => ({ ...prev, [key]: !prev[key] }))} style={{ paddingVertical: 10 }}>
          <Text style={{ color: '#2563EB' }}>{acceptedFields[key] ? '[x] Use this value' : '[ ] Check against document and use this value'}</Text>
        </TouchableOpacity> : null}
        {extractedItem?.sourceText ? <Text style={styles.subtitle}>Read from scan: {extractedItem.sourceText}</Text> : null}
        {extractedItem?.warningMessage ? (
          <Text style={styles.warningText}>⚠️ {extractedItem.warningMessage}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Document Scanned Successfully</Text>
              <Text style={styles.subtitle}>
                Select the values you checked against the photo. Unselected fields will not be filled.
              </Text>
            </View>
          </View>

          {/* Fields Review List */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {imageUri ? <Image source={{ uri: imageUri }} resizeMode="contain" style={{ width: '100%', height: 300 }} /> : null}
            {renderFieldReviewInput('registrationNumber', 'Registration Number', extractionResult.fields.registrationNumber)}
            {renderFieldReviewInput('chassisNumber', 'Chassis Number', extractionResult.fields.chassisNumber)}
            {renderFieldReviewInput('engineNumber', 'Engine Number', extractionResult.fields.engineNumber)}
            {renderFieldReviewInput('currentOwnerName', 'Current Owner Name', extractionResult.fields.currentOwnerName)}
            {renderFieldReviewInput('currentOwnerAddress', 'Current Owner Address', extractionResult.fields.currentOwnerAddress)}
            {renderFieldReviewInput('nicOrIdNumber', 'NIC / ID Number', extractionResult.fields.nicOrIdNumber)}
            {renderFieldReviewInput('absoluteOwnerName', 'Absolute Owner Name', extractionResult.fields.absoluteOwnerName)}
            {renderFieldReviewInput('absoluteOwnerAddress', 'Absolute Owner Address', extractionResult.fields.absoluteOwnerAddress)}
            {renderFieldReviewInput('make', 'Make', extractionResult.fields.make)}
            {renderFieldReviewInput('model', 'Model', extractionResult.fields.model)}
            {renderFieldReviewInput('manufacturerDescription', "Manufacturer's Description", extractionResult.fields.manufacturerDescription)}
            {renderFieldReviewInput('vehicleClass', 'Class of Vehicle', extractionResult.fields.vehicleClass)}
            {renderFieldReviewInput('taxationClass', 'Taxation Class', extractionResult.fields.taxationClass)}
            {renderFieldReviewInput('statusWhenRegistered', 'Status when Registered', extractionResult.fields.statusWhenRegistered)}
            {renderFieldReviewInput('fuelType', 'Fuel Type', extractionResult.fields.fuelType)}
            {renderFieldReviewInput('bodyType', 'Type of Body', extractionResult.fields.bodyType)}
            {renderFieldReviewInput('colour', 'Colour', extractionResult.fields.colour)}
            {renderFieldReviewInput('cylinderCapacity', 'Cylinder Capacity (CC)', extractionResult.fields.cylinderCapacity)}
            {renderFieldReviewInput('yearOfManufacture', 'Year of Manufacture', extractionResult.fields.yearOfManufacture)}
            {renderFieldReviewInput('countryOfOrigin', 'Country of Origin', extractionResult.fields.countryOfOrigin)}
            {renderFieldReviewInput('wheelBase', 'Wheel Base', extractionResult.fields.wheelBase)}
            {renderFieldReviewInput('overhang', 'Over Hang', extractionResult.fields.overhang)}
            {renderFieldReviewInput('previousOwnerCount', 'Previous Owners', extractionResult.fields.previousOwnerCount)}
            {renderFieldReviewInput('seatingCapacity', 'Seating Capacity', extractionResult.fields.seatingCapacity)}
            {renderFieldReviewInput('grossWeight', 'Gross Weight', extractionResult.fields.grossWeight)}
            {renderFieldReviewInput('unladenWeight', 'Unladen Weight', extractionResult.fields.unladenWeight)}
            {renderFieldReviewInput('tyreSize', 'Tyre Size', extractionResult.fields.tyreSize)}
            {renderFieldReviewInput('dimensions', 'Length / Width / Height', extractionResult.fields.dimensions)}
            {renderFieldReviewInput('internalHeight', 'Internal Height', extractionResult.fields.internalHeight)}
            {renderFieldReviewInput('provincialCouncil', 'Provincial Council', extractionResult.fields.provincialCouncil)}
            {renderFieldReviewInput('dateOfFirstRegistration', 'Date of First Registration', extractionResult.fields.dateOfFirstRegistration)}
            {renderFieldReviewInput('taxesPayable', 'Taxes Payable', extractionResult.fields.taxesPayable)}
            {renderFieldReviewInput('conditionsSpecialNotes', 'Conditions / Special Notes', extractionResult.fields.conditionsSpecialNotes)}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.retakeBtn} activeOpacity={0.8} onPress={onRetake || onClose}>
              <Text style={styles.retakeBtnText}>[Retake Scan]</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.88} onPress={handleConfirm} disabled={!Object.values(acceptedFields).some(Boolean)}>
              <Text style={styles.confirmBtnText}>[Confirm & Auto-Fill]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  header: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },

  scrollView: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingVertical: 8,
    gap: 12,
  },

  fieldCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fieldInput: {
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  fieldInputWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  warningText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 4,
  },

  footerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
  },
  retakeBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.6,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
