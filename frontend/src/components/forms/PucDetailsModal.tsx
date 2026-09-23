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

interface PucDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  vehicleId: string | number;
  currentOdometer?: number;
  existingPuc?: {
    certificate_number?: string;
    issue_date?: string;
    valid_until?: string;
    expiry_date?: string;
    testing_center?: string;
    test_result?: string;
    amount_paid?: number;
    notes?: string;
    document_path?: string;
  } | null;
  onSave?: () => void;
}

const LeafIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 17D6.83 17 4.5 13.5 4.5 10C4.5 7.5 6.5 5.5 9 5.5C11.5 5.5 13.5 7.5 13.5 10C13.5 10.6 13.38 11.17 13.16 11.69L11 17ZM17.5 10C17.5 12.5 15.5 14.5 13 14.5C12.4 14.5 11.83 14.38 11.31 14.16L17.5 8C17.5 8.64 17.5 9.32 17.5 10Z"
      fill="#16A34A"
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
    <Path
      d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
      stroke="#1769FF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PucDetailsModal: React.FC<PucDetailsModalProps> = ({
  visible,
  onClose,
  vehicleId,
  currentOdometer = 0,
  existingPuc,
  onSave,
}) => {
  const { theme } = useAppTheme();

  const [certNumber, setCertNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [testingCenter, setTestingCenter] = useState('');
  const [testResult, setTestResult] = useState<'Passed' | 'Failed'>('Passed');
  const [odometer, setOdometer] = useState(String(currentOdometer || ''));
  const [notes, setNotes] = useState('');
  const [docUri, setDocUri] = useState<string | null>(null);

  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setErrorMsg(null);
      if (existingPuc) {
        setCertNumber(existingPuc.certificate_number || '');
        setIssueDate((existingPuc.issue_date || new Date().toISOString().split('T')[0]).slice(0, 10));
        setExpiryDate((existingPuc.valid_until || existingPuc.expiry_date || '').slice(0, 10));
        setTestingCenter(existingPuc.testing_center || 'Clean Emission Test Center');
        setTestResult(existingPuc.test_result === 'Failed' ? 'Failed' : 'Passed');
        setNotes(existingPuc.notes || '');
        setDocUri(existingPuc.document_path || null);
      } else {
        setCertNumber('');
        setIssueDate(new Date().toISOString().split('T')[0]);
        // Default 1 year expiry
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setExpiryDate(nextYear.toISOString().split('T')[0]);
        setTestingCenter('RMV Certified Test Center');
        setTestResult('Passed');
        setOdometer(String(currentOdometer || ''));
        setNotes('');
        setDocUri(null);
      }
    }
  }, [visible, existingPuc, currentOdometer]);

  const pickDocumentImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to upload document photos.');
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
      setErrorMsg('Please enter or select the PUC expiry date.');
      return;
    }

    if (issueDate.trim() && expiryDate.trim()) {
      const issueTime = new Date(issueDate).getTime();
      const expTime = new Date(expiryDate).getTime();
      if (!isNaN(issueTime) && !isNaN(expTime) && expTime <= issueTime) {
        setErrorMsg('Expiry Date must be after Issue Date.');
        return;
      }
    }

    if (issueDate && (!validDocumentDate(issueDate) || issueDate > expiryDate)) { setErrorMsg('Enter a valid start date on or before expiry.'); return; }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('valid_until', expiryDate.trim());
      formData.append('amount_paid', '0');
      if (certNumber) formData.append('certificate_number', certNumber.trim());
      if (testingCenter) formData.append('testing_center', testingCenter.trim());
      if (notes) formData.append('notes', notes.trim());

      if (docUri && !docUri.startsWith('http')) {
        const filename = docUri.split('/').pop() || 'puc_cert.jpg';
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

      await apiFetch(`/vehicles/${vehicleId}/tax`, {
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
                <LeafIcon />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>PUC Details</Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Pollution Under Control Certificate
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
                  {formatDisplayDate(expiryDate)} ({statusCfg.badgeText})
                </Text>
              </View>
            ) : null}

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Certificate Number */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Certificate Number</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="e.g. PUC-2026-89410"
              placeholderTextColor={theme.textFaint}
              value={certNumber}
              onChangeText={setCertNumber}
            />

            {/* Dates Row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Issue Date</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textFaint}
                  value={issueDate}
                  onChangeText={setIssueDate}
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

            {/* Testing Center */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Testing Center</Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="e.g. DriveGreen Emission Center"
              placeholderTextColor={theme.textFaint}
              value={testingCenter}
              onChangeText={setTestingCenter}
            />

            {/* Test Result Selector */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Test Result</Text>
            <View style={styles.resultSelector}>
              <TouchableOpacity
                style={[
                  styles.resultPill,
                  testResult === 'Passed' && styles.resultPillPassed,
                ]}
                onPress={() => setTestResult('Passed')}>
                <Text
                  style={[
                    styles.resultPillText,
                    testResult === 'Passed' && styles.resultPillTextPassed,
                  ]}>
                  ✓ Passed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resultPill,
                  testResult === 'Failed' && styles.resultPillFailed,
                ]}
                onPress={() => setTestResult('Failed')}>
                <Text
                  style={[
                    styles.resultPillText,
                    testResult === 'Failed' && styles.resultPillTextFailed,
                  ]}>
                  ✕ Failed
                </Text>
              </TouchableOpacity>
            </View>

            {/* Document Upload Button */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Certificate Document / Photo</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocumentImage}>
              <CameraIcon />
              <Text style={styles.uploadBtnText}>
                {docUri ? 'Certificate Attached (Tap to change)' : 'Upload Certificate / Photo'}
              </Text>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Notes / Remarks</Text>
            <TextInput
              style={[styles.input, styles.multilineInput, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Additional emission test notes..."
              placeholderTextColor={theme.textFaint}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
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
                <Text style={styles.saveBtnText}>Save PUC Details</Text>
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
    backgroundColor: '#DCFCE7',
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
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  resultSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  resultPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EAF2',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  resultPillPassed: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  resultPillFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  resultPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  resultPillTextPassed: {
    color: '#16A34A',
  },
  resultPillTextFailed: {
    color: '#EF4444',
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
