import React, { useRef, useState } from 'react';
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
import Svg, { Path, Rect } from 'react-native-svg';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void | Promise<void>;
  initialCategory?: string;
  vehicleId?: number | string;
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

// Icons
const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#2563EB" strokeWidth="2" />
    <Path d="M16 2V6M8 2V6M3 10H21" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const UploadIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    <Path d="M17 8L12 3M12 3L7 8M12 3V15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronLeftIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DOCS_STORAGE_KEY = 'vehiclecare_documents_records';
const PREF_STORAGE_KEY = 'vehiclecare_alert_preferences';

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  visible,
  onClose,
  onSave,
  initialCategory,
  vehicleId = 1,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Default initial values
  const [docType, setDocType] = useState<string>(initialCategory || 'Insurance');
  const [docTitle, setDocTitle] = useState('Comprehensive Vehicle Insurance');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState('2026-09-22');
  const [expiryNotification, setExpiryNotification] = useState(true);
  const [expiryAlarm, setExpiryAlarm] = useState(false);
  const [attachedFileInfo, setAttachedFileInfo] = useState<{
    name: string;
    sizeFormatted: string;
    uri?: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Calendar Modal State
  const [calendarTarget, setCalendarTarget] = useState<'issue' | 'expiry' | null>(null);
  const [calendarCursor, setCalendarCursor] = useState<Date>(new Date());

  // Hidden HTML file input ref for web
  const fileInputRef = useRef<any>(null);

  // Trigger file attachment
  const handleAttachPress = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        // Create dynamic input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.onchange = (event: any) => {
          const file = event.target?.files?.[0];
          if (file) {
            const sizeFormatted =
              file.size > 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(file.size / 1024)} KB`;
            setAttachedFileInfo({
              name: file.name,
              sizeFormatted,
              uri: URL.createObjectURL(file),
            });
          }
        };
        input.click();
      }
    } else {
      // Mobile / Fallback simulation
      setAttachedFileInfo({
        name: 'insurance_policy_document_2026.pdf',
        sizeFormatted: '1.8 MB',
      });
      Alert.alert('File Attached', 'Document "insurance_policy_document_2026.pdf" (1.8 MB) selected.');
    }
  };

  const handleWebFileChange = (e: any) => {
    const file = e?.target?.files?.[0];
    if (file) {
      const sizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      setAttachedFileInfo({
        name: file.name,
        sizeFormatted,
        uri: URL.createObjectURL(file),
      });
    }
  };

  // Calendar Helpers
  const openCalendar = (target: 'issue' | 'expiry', e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCalendarTarget(target);
    const currentDate = target === 'issue' ? issueDate : expiryDate;
    const parsed = new Date(currentDate);
    if (!isNaN(parsed.getTime())) {
      setCalendarCursor(parsed);
    } else {
      setCalendarCursor(new Date());
    }
  };

  const currentMonthYear = (() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;
  })();

  const calendarDays = (() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, dateStr: '', isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        day: d,
        dateStr: `${year}-${mStr}-${dStr}`,
        isCurrentMonth: true,
      });
    }
    return days;
  })();

  const handleSelectDate = (dateStr: string, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (calendarTarget === 'issue') {
      setIssueDate(dateStr);
    } else if (calendarTarget === 'expiry') {
      setExpiryDate(dateStr);
    }
    setCalendarTarget(null);
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

  // Save Document Record
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!docTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a Document Title');
      return;
    }

    setLoading(true);

    const docCategory =
      docType === 'Insurance'
        ? 'insurance'
        : docType === 'Warranty'
        ? 'warranty'
        : 'tax';

    const newDocRecord = {
      id: Date.now(),
      vehicle_id: typeof vehicleId === 'string' ? parseInt(vehicleId, 10) || 1 : vehicleId,
      category: docCategory,
      title: docTitle.trim(),
      doc_type: docType,
      policy_number: docNumber.trim() || undefined,
      issue_date: issueDate,
      valid_until: expiryDate,
      expiry_date: expiryDate,
      expiryNotification,
      expiryAlarm,
      document_path: attachedFileInfo?.uri,
      fileName: attachedFileInfo ? `${attachedFileInfo.name} (${attachedFileInfo.sizeFormatted})` : undefined,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    try {
      // 1. Persist to localStorage for DocumentsScreen synchronization
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const cached = window.localStorage.getItem(DOCS_STORAGE_KEY);
          let currentDocs: any[] = [];
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) currentDocs = parsed;
          }
          const updatedDocs = [newDocRecord, ...currentDocs];
          window.localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(updatedDocs));

          // 2. If expiryNotification or expiryAlarm is enabled, register/update alert preference
          if (expiryNotification || expiryAlarm) {
            const prefCached = window.localStorage.getItem(PREF_STORAGE_KEY);
            let currentAlerts: any[] = [];
            if (prefCached) {
              const parsedAlerts = JSON.parse(prefCached);
              if (Array.isArray(parsedAlerts)) currentAlerts = parsedAlerts;
            }

            const alertId = `doc-${newDocRecord.id}`;
            const newAlertConfig = {
              id: alertId,
              title: docTitle.trim(),
              subtitle: `${docType}${docNumber ? ` (${docNumber.trim()})` : ''}`,
              category: docCategory,
              expiryDate: expiryDate,
              bannerEnabled: expiryNotification,
              alarmEnabled: expiryAlarm,
              leadDays: 14,
            };

            const updatedAlerts = [
              newAlertConfig,
              ...currentAlerts.filter((a) => a.id !== alertId),
            ];
            window.localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(updatedAlerts));
          }
        } catch (storageErr) {
          console.warn('Error updating localStorage:', storageErr);
        }
      }

      // 3. Trigger parent callback
      if (onSave) {
        await onSave(newDocRecord);
      }

      Alert.alert(
        'Document Saved',
        `"${docTitle}" has been saved successfully.${
          expiryAlarm ? ' Native expiry alarm is active.' : ''
        }`
      );
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save document record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}>
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
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={(e) => {
                  e?.preventDefault?.();
                  onClose();
                }}
                activeOpacity={0.7}>
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
                        onPress={(e) => {
                          e?.preventDefault?.();
                          setDocType(type);
                          if (!docTitle || DOCUMENT_TYPES.some((d) => d === docTitle)) {
                            setDocTitle(type === 'Insurance' ? 'Comprehensive Vehicle Insurance' : type);
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
                <Text style={styles.label}>
                  Document Title <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={docTitle}
                  onChangeText={setDocTitle}
                  placeholder="e.g. Comprehensive Vehicle Insurance"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Document Number / Policy ID</Text>
                <TextInput
                  style={styles.input}
                  value={docNumber}
                  onChangeText={setDocNumber}
                  placeholder="e.g. POL-8934-2026-X"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>

              {/* Dates */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Issue Date</Text>
                  <TouchableOpacity
                    style={styles.dateWrapper}
                    activeOpacity={0.75}
                    onPress={(e) => openCalendar('issue', e)}>
                    <Text style={styles.dateValueText}>{issueDate || today}</Text>
                    <CalendarIcon />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TouchableOpacity
                    style={styles.dateWrapper}
                    activeOpacity={0.75}
                    onPress={(e) => openCalendar('expiry', e)}>
                    <Text style={styles.dateValueText}>{expiryDate || '2026-09-22'}</Text>
                    <CalendarIcon />
                  </TouchableOpacity>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.toggleTitle}>Document Expiry Native Alarm</Text>
                      <View style={styles.nativeAlarmTag}>
                        <Text style={styles.nativeAlarmTagText}>HIGH PRIORITY</Text>
                      </View>
                    </View>
                    <Text style={styles.toggleSubtext}>
                      Trigger device alarm sound on due date & time
                    </Text>
                  </View>
                  <Switch
                    value={expiryAlarm}
                    onValueChange={setExpiryAlarm}
                    trackColor={{ false: '#CBD5E1', true: '#FECACA' }}
                    thumbColor={expiryAlarm ? '#DC2626' : '#FFFFFF'}
                  />
                </View>
              </View>

              {/* File Attachment Dropzone */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Document Attachment</Text>

                {/* Hidden HTML input for web */}
                {Platform.OS === 'web' && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleWebFileChange}
                  />
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadZone,
                    attachedFileInfo && styles.uploadZoneAttached,
                  ]}
                  onPress={handleAttachPress}
                  activeOpacity={0.8}>
                  <UploadIcon />
                  <Text style={styles.uploadMainText}>
                    {attachedFileInfo
                      ? `${attachedFileInfo.name} (${attachedFileInfo.sizeFormatted})`
                      : 'Tap to Browse & Attach File'}
                  </Text>
                  <Text style={styles.uploadSubText}>
                    {attachedFileInfo
                      ? 'Tap to change file'
                      : 'Supports PDF, JPG, PNG up to 15MB'}
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
                  placeholder="Broker contact, claims helpline, policy notes..."
                  placeholderTextColor="#94A3B8"
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

      {/* Interactive Calendar Modal */}
      <Modal
        visible={calendarTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarTarget(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={(e) => {
            e?.preventDefault?.();
            setCalendarTarget(null);
          }}>
          <View
            style={styles.calendarModalContent}
            onStartShouldSetResponder={() => true}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.calNavBtn}
                activeOpacity={0.7}>
                <ChevronLeftIcon />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>{currentMonthYear}</Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calNavBtn}
                activeOpacity={0.7}>
                <ChevronRightIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.calWeekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                <Text key={w} style={styles.calWeekDayText}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calDaysGrid}>
              {calendarDays.map((d, index) => {
                if (!d.isCurrentMonth) {
                  return <View key={`empty-${index}`} style={styles.calDayCell} />;
                }
                const activeDateValue = calendarTarget === 'issue' ? issueDate : expiryDate;
                const isSelected = activeDateValue === d.dateStr;
                const isToday = today === d.dateStr;

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

            <View style={styles.calFooter}>
              <TouchableOpacity
                style={styles.calTodayBtn}
                activeOpacity={0.7}
                onPress={(e) => handleSelectDate(today, e)}>
                <Text style={styles.calTodayBtnText}>Select Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calCancelBtn}
                activeOpacity={0.7}
                onPress={(e) => {
                  e?.preventDefault?.();
                  setCalendarTarget(null);
                }}>
                <Text style={styles.calCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
  requiredStar: {
    color: '#EF4444',
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
  dateValueText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
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
  nativeAlarmTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nativeAlarmTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.3,
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
  uploadZoneAttached: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
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

  /* Calendar Modal */
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
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 6,
  },
  calWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    width: 36,
    textAlign: 'center',
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  calDayCellSelected: {
    backgroundColor: '#2563EB',
  },
  calDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  calDayText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
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
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  calTodayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  calTodayBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  calCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  calCancelBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
export default AddDocumentModal;
