import { validDocumentDate } from '@/utils/dashboardValidation';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/services/api';
import { calculateDaysRemaining, formatDisplayDate, getExpiryStatusConfig } from '@/utils/dashboardFormatters';

interface InsuranceDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string | number;
  existingInsurance?: {
    provider?: string;
    policy_number?: string;
    start_date?: string;
    expiry_date?: string;
    expiryDate?: string;
    reminder_days_before?: number;
    document_path?: string;
    notes?: string;
  } | null;
  onSave?: () => void;
}

const ShieldIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke="#1769FF"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
      stroke="#1769FF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const InsuranceDetailsModal: React.FC<InsuranceDetailsModalProps> = ({
  visible,
  onClose,
  vehicleId,
  existingInsurance,
  onSave,
}) => {
  const { theme } = useAppTheme();

  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyType, setPolicyType] = useState('Comprehensive Cover');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [docUri, setDocUri] = useState<string | null>(null);

  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setErrorMsg(null);
      if (existingInsurance) {
        setProvider(existingInsurance.provider || '');
        setPolicyNumber(existingInsurance.policy_number || '');
        setStartDate((existingInsurance.start_date || new Date().toISOString().split('T')[0]).slice(0, 10));
        setExpiryDate((existingInsurance.expiry_date || existingInsurance.expiryDate || '').slice(0, 10));
        setDocUri(existingInsurance.document_path || null);
      } else {
        setProvider('');
        setPolicyNumber('');
        setStartDate(new Date().toISOString().split('T')[0]);
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setExpiryDate(nextYear.toISOString().split('T')[0]);
        setPremiumAmount('');
        setDocUri(null);
      }
    }
  }, [visible, existingInsurance]);

  const pickDocumentImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to upload policy document.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setDocUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (submitting.current) return;
    setErrorMsg(null);
    if (!validDocumentDate(expiryDate.trim())) {
      setErrorMsg('Please enter or select the Insurance expiry date.');
      return;
    }

    if (startDate && (!validDocumentDate(startDate) || startDate > expiryDate)) { setErrorMsg('Enter a valid start date on or before expiry.'); return; }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('provider', provider.trim());
      formData.append('policy_number', policyNumber.trim());
      formData.append('expiry_date', expiryDate.trim());
      if (startDate) formData.append('start_date', startDate.trim());
      formData.append('reminder_days_before', '30');

      if (docUri && !docUri.startsWith('http')) {
        const filename = docUri.split('/').pop() || 'policy_doc.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        if (Platform.OS === 'web') {
          const blob = await (await fetch(docUri)).blob();
          if (blob.size > 10 * 1024 * 1024 || !['image/jpeg', 'image/png', 'application/pdf'].includes(blob.type)) throw new Error('Attach a JPG, PNG or PDF up to 10 MB.');
          formData.append('document', blob, blob.type === 'image/png' ? 'document.png' : 'document.jpg');
        } else {
          formData.append('document', { uri: docUri, name: filename, type: type === 'image/jpg' ? 'image/jpeg' : type } as any);
        }
      }

      await apiFetch(`/vehicles/${vehicleId}/insurance`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      onSave?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save. Please try again.');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const daysLeft = calculateDaysRemaining(expiryDate);
  const statusCfg = getExpiryStatusConfig(daysLeft);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={styles.iconCircle}>
                <ShieldIcon />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Insurance Policy</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Manage Vehicle Insurance & Coverage
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollForm} showsVerticalScrollIndicator={false}>
            {/* Status Summary Banner */}
            {expiryDate ? (
              <View
                style={[
                  styles.statusBanner,
                  { backgroundColor: statusCfg.bgColor, borderColor: statusCfg.borderColor },
                ]}>
                <Text style={[styles.statusBannerTitle, { color: statusCfg.textColor }]}>
                  Status: {statusCfg.label}
                </Text>
                <Text style={[styles.statusBannerText, { color: statusCfg.textColor }]}>
                  Expires {formatDisplayDate(expiryDate)} ({statusCfg.badgeText})
                </Text>
              </View>
            ) : null}

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Provider */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Insurance Provider</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="e.g. Ceylinco VIP / Sri Lanka Insurance"
              placeholderTextColor={theme.textFaint}
              value={provider}
              onChangeText={setProvider}
            />

            {/* Policy Number */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Policy Number</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="e.g. POL-984029-X"
              placeholderTextColor={theme.textFaint}
              value={policyNumber}
              onChangeText={setPolicyNumber}
            />

            {/* Coverage Type */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Coverage Type</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Comprehensive Cover / Third Party"
              placeholderTextColor={theme.textFaint}
              value={policyType}
              onChangeText={setPolicyType}
            />

            {/* Dates Row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Start Date</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textFaint}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Expiry Date *</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textFaint}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>
            </View>

            {/* Document Upload Button */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Policy Document / Photo</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocumentImage}>
              <CameraIcon />
              <Text style={styles.uploadBtnText}>
                {docUri ? 'Policy Attached (Tap to change)' : 'Upload Policy Document / Card'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Insurance</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 26, 58, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollForm: {
    maxHeight: 400,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1769FF',
    borderStyle: 'dashed',
    backgroundColor: '#EFF6FF',
    marginTop: 4,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1769FF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1769FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
