import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';

import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';

export type DocumentCategory = 'tax' | 'insurance' | 'warranty';

export interface VehicleDocument {
  id: number;
  vehicle_id?: number;
  category: DocumentCategory;
  title: string;
  valid_until: string;
  amount_paid?: number | string;
  provider?: string;
  policy_number?: string;
  document_path?: string;
  notes?: string;
  created_at?: string;
}

// Icons
const PlusIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const CloseIcon = ({ color = '#64748B' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const CalendarIcon = ({ color = '#2563EB' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
    <Path d="M16 2V6M8 2V6M3 10H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

const TrashIcon = ({ size = 16, color = '#EF4444' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M10 11V17M14 11V17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DocumentIcon = ({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ShieldIcon = ({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AwardIcon = ({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const STORAGE_KEY = 'vehiclecare_documents_records';

export default function DocumentsScreen() {
  const router = useRouter();
  const { activeVehicle, reloadVehicles } = useVehicle();

  const [activeTab, setActiveTab] = useState<DocumentCategory>('tax');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize documents state from cache
  const [documents, setDocuments] = useState<VehicleDocument[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    // Initial mock/pre-populated records matching user vehicle context
    return [
      {
        id: 1,
        vehicle_id: activeVehicle?.id || 1,
        category: 'tax',
        title: 'Revenue Licence / Tax',
        valid_until: '2027-04-30',
        amount_paid: 4500,
        notes: 'Annual vehicle emission test & revenue licence renewal',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        vehicle_id: activeVehicle?.id || 1,
        category: 'insurance',
        title: 'Comprehensive Vehicle Insurance',
        provider: 'Ceylinco VIP',
        policy_number: 'POL-CEY-849201',
        valid_until: '2027-01-15',
        amount_paid: 42500,
        notes: 'Full comprehensive cover with flood & natural disasters',
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        vehicle_id: activeVehicle?.id || 1,
        category: 'warranty',
        title: 'Manufacturer Extended Warranty',
        provider: 'Toyota Lanka',
        policy_number: 'WAR-TL-99482',
        valid_until: '2027-11-20',
        amount_paid: 0,
        notes: '3-Year / 100,000 KM manufacturer engine and transmission warranty',
        created_at: new Date().toISOString(),
      },
    ];
  });

  // Form Fields
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [docTitle, setDocTitle] = useState('');
  const [validUntil, setValidUntil] = useState('2027-04-30');
  const [amountPaid, setAmountPaid] = useState('');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(new Date());

  // Image Preview Modal
  const [previewModalUri, setPreviewModalUri] = useState<string | null>(null);

  // User feedback toast / alert banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync documents to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
      } catch {}
    }
  }, [documents]);

  // Pick Image from device
  const pickImage = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      // Fallback mock upload for web environments if needed
      setSelectedImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
    }
  };

  // Status computation
  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'Active', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' };
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      return { label: 'Expired', color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' };
    }
    if (diffDays <= 30) {
      return { label: `Due in ${diffDays}d`, color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' };
    }
    return { label: 'Active', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0' };
  };

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

  const handlePrevMonth = (e?: any) => {
    e?.preventDefault?.();
    setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1));
  };

  const handleNextMonth = (e?: any) => {
    e?.preventDefault?.();
    setCalendarCursor(new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1));
  };

  const handleSelectDate = (dateStr: string, e?: any) => {
    e?.preventDefault?.();
    setValidUntil(dateStr);
    setShowCalendar(false);
  };

  // Reset form when switching tabs or closing
  const resetForm = (tab: DocumentCategory = activeTab) => {
    if (tab === 'tax') {
      setValidUntil('2027-04-30');
      setDocTitle('Revenue Licence / Tax');
    } else if (tab === 'insurance') {
      setValidUntil('2027-01-15');
      setDocTitle('Comprehensive Vehicle Insurance');
    } else {
      setValidUntil('2027-11-20');
      setDocTitle('Vehicle Warranty');
    }
    setAmountPaid('');
    setProvider('');
    setPolicyNumber('');
    setNotes('');
    setSelectedImage(null);
    setFormErrors({});
  };

  // Open add form and smoothly bring into view
  const openAddForm = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!docTitle) {
      if (activeTab === 'tax') setDocTitle('Revenue Licence / Tax');
      else if (activeTab === 'insurance') setDocTitle('Comprehensive Vehicle Insurance');
      else setDocTitle('Manufacturer Warranty');
    }
    setShowForm(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 50);
  };

  // Save Document Record
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const errors: Record<string, string> = {};
    if (!validUntil || !validUntil.trim()) {
      errors.validUntil = 'Valid until date is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    let finalTitle = docTitle.trim();
    if (!finalTitle) {
      if (activeTab === 'insurance') {
        finalTitle = provider.trim() ? `${provider.trim()} Insurance` : 'Vehicle Insurance';
      } else if (activeTab === 'warranty') {
        finalTitle = provider.trim() ? `${provider.trim()} Warranty` : 'Manufacturer Warranty';
      } else {
        finalTitle = 'Revenue Licence / Tax';
      }
    }

    const newDoc: VehicleDocument = {
      id: Date.now(),
      vehicle_id: activeVehicle?.id || 1,
      category: activeTab,
      title: finalTitle,
      valid_until: validUntil.trim(),
      amount_paid: amountPaid.trim() ? Number(amountPaid) : undefined,
      provider: provider.trim() || undefined,
      policy_number: policyNumber.trim() || undefined,
      document_path: selectedImage || undefined,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    // 1. Instantly append to state array
    setDocuments((prev) => [newDoc, ...prev]);

    // 2. Reset form and collapse
    resetForm(activeTab);
    setShowForm(false);
    setSubmitting(false);

    // 3. Show instant confirmation toast
    const categoryName =
      activeTab === 'tax' ? 'Revenue licence' : activeTab === 'insurance' ? 'Insurance policy' : 'Warranty record';
    setToastMessage(`✓ ${categoryName} saved successfully!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    // 4. Background sync if activeVehicle is available
    if (activeVehicle?.id) {
      try {
        const endpoint =
          activeTab === 'tax' ? 'tax' : activeTab === 'insurance' ? 'insurance' : 'warranty';
        await apiFetch(`/vehicles/${activeVehicle.id}/${endpoint}`, {
          method: 'POST',
          body: {
            title: newDoc.title,
            valid_until: newDoc.valid_until,
            amount_paid: newDoc.amount_paid,
            provider: newDoc.provider,
            policy_number: newDoc.policy_number,
            notes: newDoc.notes,
          },
        });
        if (reloadVehicles) {
          await reloadVehicles(activeVehicle.id);
        }
      } catch {
        // Safe offline fallback: maintained in local state and localStorage
      }
    }
  };

  // Delete Document Record
  const handleDelete = async (id: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Instant removal from state
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setToastMessage('Document record removed');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filtered documents for current tab
  const currentTabDocuments = useMemo(() => {
    return documents.filter((d) => d.category === activeTab);
  }, [documents, activeTab]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backTouch}
            activeOpacity={0.7}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              router.back();
            }}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Vehicle Documents</Text>
            <Text style={styles.headerSubtitle}>
              {activeVehicle
                ? `${activeVehicle.brand || ''} ${activeVehicle.model || ''} (${activeVehicle.registration_number || ''})`.trim()
                : 'Revenue Licence, Insurance & Warranty'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addToggleBtn, showForm && styles.addToggleBtnActive]}
            activeOpacity={0.8}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              if (showForm) {
                setShowForm(false);
              } else {
                openAddForm(e);
              }
            }}>
            {showForm ? (
              <>
                <CloseIcon color="#FFFFFF" />
                <Text style={styles.addToggleBtnText}>Close</Text>
              </>
            ) : (
              <>
                <PlusIcon />
                <Text style={styles.addToggleBtnText}>+ Add / Renew</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 3 Functional Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tax' && styles.tabActive]}
            activeOpacity={0.7}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              setActiveTab('tax');
              resetForm('tax');
            }}>
            <DocumentIcon
              size={16}
              color={activeTab === 'tax' ? '#2563EB' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'tax' && styles.tabTextActive]}>
              Tax / Licence
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'insurance' && styles.tabActive]}
            activeOpacity={0.7}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              setActiveTab('insurance');
              resetForm('insurance');
            }}>
            <ShieldIcon
              size={16}
              color={activeTab === 'insurance' ? '#2563EB' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'insurance' && styles.tabTextActive]}>
              Insurance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'warranty' && styles.tabActive]}
            activeOpacity={0.7}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              setActiveTab('warranty');
              resetForm('warranty');
            }}>
            <AwardIcon
              size={16}
              color={activeTab === 'warranty' ? '#2563EB' : '#64748B'}
            />
            <Text style={[styles.tabText, activeTab === 'warranty' && styles.tabTextActive]}>
              Warranty
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Inline Form Accordion */}
          {showForm && (
            <View style={styles.inlineFormCard}>
              <View style={styles.inlineFormHeader}>
                <View style={styles.inlineFormTitleRow}>
                  <View style={styles.formIconBadge}>
                    {activeTab === 'tax' ? (
                      <DocumentIcon size={18} color="#2563EB" />
                    ) : activeTab === 'insurance' ? (
                      <ShieldIcon size={18} color="#2563EB" />
                    ) : (
                      <AwardIcon size={18} color="#2563EB" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.inlineFormTitle}>
                      {activeTab === 'tax'
                        ? 'Record Revenue Licence / Tax'
                        : activeTab === 'insurance'
                        ? 'Record Insurance Policy'
                        : 'Record Warranty Coverage'}
                    </Text>
                    <Text style={styles.inlineFormSubtitle}>
                      Enter renewal details, validity date, and upload document photo
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.formCloseTouch}
                  activeOpacity={0.7}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setShowForm(false);
                  }}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>

              {/* Form Body */}
              <View style={styles.formBody}>
                {/* Document Title field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Document Title <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      activeTab === 'tax'
                        ? 'e.g. Revenue Licence / Tax 2026-2027'
                        : activeTab === 'insurance'
                        ? 'e.g. Comprehensive Vehicle Insurance'
                        : 'e.g. Manufacturer Extended Warranty'
                    }
                    placeholderTextColor="#94A3B8"
                    value={docTitle}
                    onChangeText={setDocTitle}
                  />
                </View>

                {/* Insurance / Warranty specific fields */}
                {activeTab !== 'tax' && (
                  <View style={styles.formGrid}>
                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>
                        {activeTab === 'insurance' ? 'Insurance Provider' : 'Warranty Provider / Dealer'}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={
                          activeTab === 'insurance'
                            ? 'e.g. Ceylinco, Allianz, Sri Lanka Insurance'
                            : 'e.g. Toyota Lanka, Micro, Agent'
                        }
                        placeholderTextColor="#94A3B8"
                        value={provider}
                        onChangeText={setProvider}
                      />
                    </View>

                    <View style={styles.inputCol}>
                      <Text style={styles.inputLabel}>
                        {activeTab === 'insurance' ? 'Policy Number' : 'Warranty / Policy ID'}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. POL-984210"
                        placeholderTextColor="#94A3B8"
                        value={policyNumber}
                        onChangeText={setPolicyNumber}
                      />
                    </View>
                  </View>
                )}

                {/* Valid Until & Amount Paid */}
                <View style={styles.formGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>
                      Valid Until (YYYY-MM-DD) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.datePickerTrigger}
                      activeOpacity={0.7}
                      onPress={(e: any) => {
                        e?.preventDefault?.();
                        setShowCalendar(true);
                      }}>
                      <CalendarIcon />
                      <Text style={styles.datePickerValueText}>{validUntil || todayStr}</Text>
                    </TouchableOpacity>
                    {formErrors.validUntil && (
                      <Text style={styles.errorText}>{formErrors.validUntil}</Text>
                    )}
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Amount Paid (LKR)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 4500"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={amountPaid}
                      onChangeText={setAmountPaid}
                    />
                  </View>
                </View>

                {/* Document Photo Upload Zone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document Photo / Attachment</Text>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    activeOpacity={0.7}
                    onPress={pickImage}>
                    {selectedImage ? (
                      <View style={styles.previewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                        <View style={styles.changeOverlay}>
                          <Text style={styles.changeOverlayText}>Tap to change photo</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Text style={{ fontSize: 26, marginBottom: 4 }}>📄</Text>
                        <Text style={styles.uploadTitle}>
                          Tap to select or change document photo
                        </Text>
                        <Text style={styles.uploadSubtitle}>
                          Supports JPEG, PNG, or camera capture
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Notes / Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    placeholder="Reference remarks, branch details, or coverage exclusions..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* Form Buttons */}
                <View style={styles.formActionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                    onPress={(e: any) => {
                      e?.preventDefault?.();
                      setShowForm(false);
                    }}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, submitting && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    disabled={submitting}
                    onPress={handleSave}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckIcon size={14} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Save Document Record</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Section Header & Records Count */}
          <View style={styles.historySectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {activeTab === 'tax'
                  ? 'Revenue Licence / Tax Records'
                  : activeTab === 'insurance'
                  ? 'Insurance Policies'
                  : 'Warranty Records'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {activeTab === 'tax'
                  ? 'Annual vehicle taxation and emission fitness certificates'
                  : activeTab === 'insurance'
                  ? 'Comprehensive policy covers and third-party certificates'
                  : 'Official warranty coverage and claim references'}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{currentTabDocuments.length} Saved</Text>
            </View>
          </View>

          {/* Toast Notification Banner */}
          {Boolean(toastMessage) && (
            <View style={styles.toastBanner}>
              <Text style={styles.toastBannerText}>{toastMessage}</Text>
            </View>
          )}

          {/* Documents History List */}
          {currentTabDocuments.length === 0 ? (
            showForm ? null : (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconBadge}>
                  {activeTab === 'tax' ? (
                    <DocumentIcon size={34} color="#2563EB" />
                  ) : activeTab === 'insurance' ? (
                    <ShieldIcon size={34} color="#2563EB" />
                  ) : (
                    <AwardIcon size={34} color="#2563EB" />
                  )}
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'tax'
                    ? 'No Revenue Licence Records Yet 📄'
                    : activeTab === 'insurance'
                    ? 'No Insurance Records Yet 🛡️'
                    : 'No Warranty Records Yet 📜'}
                </Text>
                <Text style={styles.emptyMessage}>
                  Keep digital copies and renewal validity dates organized in one place. Click "+ Add / Renew" to log your document.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={openAddForm}>
                  <PlusIcon />
                  <Text style={styles.emptyActionBtnText}>Add First Document</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.recordsList}>
              {currentTabDocuments.map((doc) => {
                const status = getDocumentStatus(doc.valid_until);
                return (
                  <View key={doc.id} style={styles.recordCard}>
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.cardIconBadge}>
                          {doc.category === 'tax' ? (
                            <DocumentIcon size={18} color="#2563EB" />
                          ) : doc.category === 'insurance' ? (
                            <ShieldIcon size={18} color="#2563EB" />
                          ) : (
                            <AwardIcon size={18} color="#2563EB" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docTitle} numberOfLines={1}>
                            {doc.title}
                          </Text>
                          {Boolean(doc.provider || doc.policy_number) && (
                            <Text style={styles.docSubMeta} numberOfLines={1}>
                              {[doc.provider, doc.policy_number].filter(Boolean).join(' • ')}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Status Badge & Delete Button */}
                      <View style={styles.cardHeaderRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: status.bg, borderColor: status.border },
                          ]}>
                          <Text style={[styles.statusBadgeText, { color: status.color }]}>
                            {status.label.toUpperCase()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.trashBtn}
                          activeOpacity={0.7}
                          onPress={(e) => handleDelete(doc.id, e)}>
                          <TrashIcon size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Meta details */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>VALID UNTIL</Text>
                        <View style={styles.dateBadge}>
                          <CalendarIcon color="#2563EB" />
                          <Text style={styles.dateBadgeText}>{formatDate(doc.valid_until)}</Text>
                        </View>
                      </View>

                      {doc.amount_paid !== undefined && (
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>AMOUNT PAID</Text>
                          <Text style={styles.amountText}>
                            {Number(doc.amount_paid) > 0
                              ? formatCurrency(doc.amount_paid)
                              : 'Included / Free'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Notes if present */}
                    {Boolean(doc.notes) && (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{doc.notes}</Text>
                      </View>
                    )}

                    {/* Document Photo preview */}
                    {Boolean(doc.document_path) && (
                      <TouchableOpacity
                        style={styles.thumbnailContainer}
                        activeOpacity={0.8}
                        onPress={() => setPreviewModalUri(doc.document_path || null)}>
                        <Image source={{ uri: doc.document_path }} style={styles.thumbnailImage} />
                        <View style={styles.thumbnailLabelRow}>
                          <Text style={styles.thumbnailLabel}>📎 View Document Photo</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Interactive Calendar Modal */}
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModalContent}>
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
                  const isSelected = validUntil === d.dateStr;
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
                    setShowCalendar(false);
                  }}>
                  <Text style={styles.calCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Document Photo Full Preview Modal */}
        <Modal
          visible={Boolean(previewModalUri)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewModalUri(null)}>
          <View style={styles.photoPreviewOverlay}>
            <View style={styles.photoPreviewBox}>
              <View style={styles.photoPreviewHeader}>
                <Text style={styles.photoPreviewTitle}>Document Photo</Text>
                <TouchableOpacity
                  style={styles.photoCloseBtn}
                  onPress={() => setPreviewModalUri(null)}>
                  <CloseIcon color="#0F172A" />
                </TouchableOpacity>
              </View>
              {previewModalUri && (
                <Image
                  source={{ uri: previewModalUri }}
                  style={styles.photoPreviewImage}
                  contentFit="contain"
                />
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 18,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backTouch: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backLink: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addToggleBtnActive: {
    backgroundColor: '#475569',
  },
  addToggleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  inlineFormCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  inlineFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  inlineFormTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  formIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineFormTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  inlineFormSubtitle: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 1,
  },
  formCloseTouch: {
    padding: 6,
  },
  formBody: {
    padding: 16,
    gap: 13,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  textAreaInput: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  datePickerValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
    fontWeight: '500',
  },
  uploadBox: {
    height: 120,
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: 12,
  },
  uploadTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  changeOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  formActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toastBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastBannerText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 280,
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    marginTop: 14,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  recordsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  docSubMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  trashBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    gap: 3,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  notesBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  thumbnailContainer: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  thumbnailImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  thumbnailLabelRow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  thumbnailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
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
  calNavBtn: {
    padding: 6,
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
    paddingHorizontal: 10,
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
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  calCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  photoPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoPreviewBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  photoPreviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  photoCloseBtn: {
    padding: 4,
  },
  photoPreviewImage: {
    width: '100%',
    height: 380,
  },
});

