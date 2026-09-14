import React, { useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { DatePickerField } from '@/components/ui/DatePickerField';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
}

const DOCUMENT_TYPES = [
  'RC Book',
  'Insurance',
  'PUC Certificate',
  'Driving Licence',
  'Invoice',
  'Warranty',
  'Service Book',
  'Pollution Certificate',
  'Other',
] as const;

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const UploadIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    <Path d="M17 8L12 3M12 3L7 8M12 3V15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [docType, setDocType] = useState<string>('Insurance');
  const [docTitle, setDocTitle] = useState('Comprehensive Vehicle Insurance');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState('2026-09-22');
  const [expiryNotification, setExpiryNotification] = useState(true);
  const [expiryAlarm, setExpiryAlarm] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAttach = () => {
    // Mock attachment selection
    setAttachedFile('insurance_policy_document_2026.pdf (1.8 MB)');
    Alert.alert('File Attached', 'Document "insurance_policy_document_2026.pdf" selected.');
  };

  const handleSave = () => {
    if (!docTitle.trim()) {
      Alert.alert('Required', 'Please enter a Document Title');
      return;
    }

    setLoading(true);
    const documentData = {
      docType,
      docTitle: docTitle.trim(),
      docNumber: docNumber.trim() || undefined,
      issueDate,
      expiryDate,
      expiryNotification,
      expiryAlarm,
      attachedFile,
      notes: notes.trim() || undefined,
    };

    setTimeout(() => {
      setLoading(false);
      if (onSave) onSave(documentData);
      Alert.alert('Success', `Document "${docTitle}" saved successfully!`);
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Document</Text>
              <Text style={styles.subtitle}>Store vehicle certificates, policies, and permits</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Document Type Pills */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Document Type</Text>
              <View style={styles.pillsWrap}>
                {DOCUMENT_TYPES.map((type) => {
                  const active = docType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => {
                        setDocType(type);
                        if (!docTitle || DOCUMENT_TYPES.some((d) => d === docTitle)) {
                          setDocTitle(type);
                        }
                      }}
                      activeOpacity={0.75}>
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Title & Document Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Title *</Text>
              <TextInput
                style={styles.input}
                value={docTitle}
                onChangeText={setDocTitle}
                placeholder="e.g. HDFC ERGO Motor Insurance"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Document Number / Policy ID</Text>
              <TextInput
                style={styles.input}
                value={docNumber}
                onChangeText={setDocNumber}
                placeholder="e.g. POL-8934-2026-X"
                autoCapitalize="characters"
              />
            </View>

            {/* Dates */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Issue Date</Text>
                <DatePickerField value={issueDate} onChangeText={setIssueDate} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <DatePickerField value={expiryDate} onChangeText={setExpiryDate} />
              </View>
            </View>

            {/* Notification & Alarm Toggles */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Expiry Reminder Settings</Text>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>Document Expiry Notification</Text>
                  <Text style={styles.toggleSubtext}>
                    Receive banner notifications before and on expiry
                  </Text>
                </View>
                <Switch
                  value={expiryNotification}
                  onValueChange={setExpiryNotification}
                  trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                  thumbColor={expiryNotification ? '#2563EB' : '#FFFFFF'}
                />
              </View>

              <View style={[styles.toggleRow, styles.toggleDivider]}>
                <View style={styles.toggleTextWrapper}>
                  <Text style={styles.toggleTitle}>Document Expiry Native Alarm</Text>
                  <Text style={styles.toggleSubtext}>
                    Trigger device alarm sound on due date & time
                  </Text>
                </View>
                <Switch
                  value={expiryAlarm}
                  onValueChange={setExpiryAlarm}
                  trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                  thumbColor={expiryAlarm ? '#2563EB' : '#FFFFFF'}
                />
              </View>
            </View>

            {/* File Attachment Zone */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Document Attachment</Text>
              <TouchableOpacity
                style={styles.uploadZone}
                onPress={handleAttach}
                activeOpacity={0.8}>
                <UploadIcon />
                <Text style={styles.uploadMainText}>
                  {attachedFile ? attachedFile : 'Tap to Browse & Attach File'}
                </Text>
                <Text style={styles.uploadSubText}>
                  {attachedFile ? 'Tap to change file' : 'Supports PDF, JPG, PNG up to 15MB'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Broker contact, claims helpline, terms..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving Document...' : 'Save Document'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 76,
    paddingTop: 10,
  },
  dateWrapper: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
    paddingTop: 10,
  },
  toggleTextWrapper: {
    flex: 1,
    paddingRight: 14,
  },
  toggleTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  toggleSubtext: {
    fontSize: 11.5,
    color: '#64748B',
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  uploadSubText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveBtn: {
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
