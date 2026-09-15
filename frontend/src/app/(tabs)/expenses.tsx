import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';

import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';
import { dataCache } from '@/services/dataCache';
import { formatCurrency, formatDate } from '@/utils/format';

export interface ExpenseRecord {
  id: number;
  vehicle_id?: number;
  expense_date: string;
  amount: number | string;
  description: string;
  category: string;
  payment_method?: string;
  notes?: string | null;
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

const ReceiptIcon = ({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 2V22L7 20L10 22L13 20L16 22L19 20L22 22V2L19 4L16 2L13 4L10 2L7 4L4 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M8 8H16M8 12H16M8 16H12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SearchIcon = ({ size = 18, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

const EXPENSE_CATEGORIES = [
  'Fuel',
  'Service',
  'Repair',
  'Parking',
  'Toll',
  'Insurance',
  'Washing',
  'Accessories',
  'Fines',
  'Tax',
  'Loan EMI',
  'Other',
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'NetBanking', 'Other'];

const FILTER_CATEGORIES = ['ALL', 'FUEL', 'SERVICE', 'REPLACEMENT', 'PARKING', 'TOLL', 'OTHER'];

const DESCRIPTION_SUGGESTIONS = [
  'Expressway Toll',
  'Mall Parking',
  'Car Wash & Vacuum',
  'Insurance Renewal',
  'Wheel Alignment',
  'Puncture Repair',
  'Air Freshener',
];

const STORAGE_KEY = 'vehiclecare_expenses_list';

export default function ExpensesScreen() {
  const { activeVehicle } = useVehicle();
  const params = useLocalSearchParams<{ openAdd?: string }>();

  // Initialize expenses from cache if available
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Loading starts as false so it never locks the screen in an infinite loop
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(new Date());

  // Check URL params for openAdd
  useEffect(() => {
    if (params.openAdd === 'true' || params.openAdd === '1') {
      setShowForm(true);
    }
  }, [params.openAdd]);

  // Sync expenses to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      } catch {}
    }
  }, [expenses]);

  // Fetch expenses from backend gracefully with in-memory caching
  const fetchExpenses = useCallback(async (force = false) => {
    if (!activeVehicle?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cacheKey = `expenses_${activeVehicle.id}`;
    if (!force) {
      const cached = dataCache.get<ExpenseRecord[]>(cacheKey, 60000);
      if (cached && cached.length > 0) {
        setExpenses(cached);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

    try {
      const data = await apiFetch<any[]>(`/vehicles/${activeVehicle.id}/expenses`);
      if (Array.isArray(data)) {
        setExpenses((prev) => {
          const formattedServerData: ExpenseRecord[] = data.map((item) => ({
            id: item.id,
            vehicle_id: item.vehicle_id || activeVehicle.id,
            expense_date: item.expense_date || todayStr,
            amount: item.amount,
            description: item.description || 'Expense',
            category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Other',
            payment_method: item.payment_method || 'Cash',
            notes: item.notes,
            created_at: item.created_at,
          }));

          const serverIds = new Set(formattedServerData.map((d) => d.id));
          const localOnly = prev.filter(
            (p) => !serverIds.has(p.id) && String(p.id).length > 10
          );
          const merged = [...localOnly, ...formattedServerData];
          dataCache.set(cacheKey, merged);
          return merged;
        });
      }
    } catch {
      // Gracefully keep cached/state records
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeVehicle?.id, todayStr]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses(true);
  }, [fetchExpenses]);

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
    setExpenseDate(dateStr);
    setShowCalendar(false);
  };

  // Save Expense Record
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const errors: Record<string, string> = {};
    const amtNum = Number(amount);

    if (!amount.trim() || isNaN(amtNum) || amtNum <= 0) {
      errors.amount = 'Valid expense amount is required.';
    }
    if (!description.trim()) {
      errors.description = 'Description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    const newRecord: ExpenseRecord = {
      id: Date.now(),
      vehicle_id: activeVehicle?.id || 1,
      expense_date: expenseDate.trim() || todayStr,
      amount: amtNum,
      description: description.trim(),
      category: category,
      payment_method: paymentMethod,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    // 1. Instantly append to state array so the history list updates immediately!
    setExpenses((prev) => {
      const updated = [newRecord, ...prev];
      if (activeVehicle?.id) {
        dataCache.set(`expenses_${activeVehicle.id}`, updated);
      }
      return updated;
    });

    // 2. Reset form fields and collapse inline form
    setAmount('');
    setDescription('');
    setCategory('Other');
    setPaymentMethod('Cash');
    setNotes('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
    setSubmitting(false);

    // 3. If connected to an active vehicle, sync with backend API in background
    if (activeVehicle?.id) {
      try {
        const response = await apiFetch<any>(`/vehicles/${activeVehicle.id}/expenses`, {
          method: 'POST',
          body: {
            expense_date: newRecord.expense_date,
            amount: Number(newRecord.amount),
            description: newRecord.description,
            category: newRecord.category.toLowerCase(),
            payment_method: newRecord.payment_method,
            notes: newRecord.notes,
          },
        });

        if (response && response.id) {
          setExpenses((prev) => {
            const mapped = prev.map((item) => (item.id === newRecord.id ? { ...newRecord, id: response.id } : item));
            dataCache.set(`expenses_${activeVehicle.id}`, mapped);
            return mapped;
          });
        }
      } catch {
        // Record safely maintained in state array and localStorage cache
      }
    }
  };

  // Delete Functionality: Instantly removes entry from state array
  const handleDelete = async (id: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Remove immediately from UI and cache
    setExpenses((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (activeVehicle?.id) {
        dataCache.set(`expenses_${activeVehicle.id}`, updated);
      }
      return updated;
    });

    // Non-blocking background deletion
    try {
      if (activeVehicle?.id) {
        await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      }
    } catch {
      // Offline fallback: entry remains removed from local state
    }
  };

  // Category Color Helpers
  const getCategoryBadgeStyle = (cat: string) => {
    const c = (cat || '').toLowerCase();
    switch (c) {
      case 'fuel':
        return { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
      case 'service':
        return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
      case 'repair':
      case 'replacement':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'parking':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' };
      case 'toll':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'insurance':
      case 'tax':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
      case 'washing':
        return { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
    }
  };

  // Real-Time Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const cat = selectedCategory.toLowerCase();
    const q = search.trim().toLowerCase();

    return expenses.filter((ex) => {
      const itemCat = (ex.category || 'other').toLowerCase();
      const matchesCategory =
        cat === 'all' ||
        (cat === 'replacement' && (itemCat === 'replacement' || itemCat === 'repair')) ||
        (cat === 'other' && !['fuel', 'service', 'replacement', 'repair', 'parking', 'toll'].includes(itemCat)) ||
        itemCat === cat;

      const matchesSearch =
        !q ||
        (ex.description || '').toLowerCase().includes(q) ||
        (ex.category || '').toLowerCase().includes(q) ||
        (ex.payment_method || '').toLowerCase().includes(q) ||
        (ex.notes || '').toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [expenses, selectedCategory, search]);

  // Metric Totals
  const grandTotal = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [expenses]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [filteredExpenses]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Expenses Ledger</Text>
            <Text style={styles.subtitle}>
              {activeVehicle
                ? `${activeVehicle.brand || ''} ${activeVehicle.model || ''} (${activeVehicle.registration_number || ''})`.trim()
                : 'Track routine, operational, and custom vehicle expenses'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, showForm && styles.addBtnActive]}
            activeOpacity={0.8}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              setShowForm((prev) => !prev);
            }}>
            {showForm ? (
              <>
                <CloseIcon color="#FFFFFF" />
                <Text style={styles.addBtnText}>Close</Text>
              </>
            ) : (
              <>
                <PlusIcon />
                <Text style={styles.addBtnText}>+ Add Other</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }>
          {/* Summary Metric Cards */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL EXPENSES</Text>
              <Text style={[styles.metricValue, { color: '#2563EB' }]}>
                {formatCurrency(grandTotal)}
              </Text>
              <Text style={styles.metricSub}>All ledger records</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{selectedCategory} SUBTOTAL</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(filteredTotal)}
              </Text>
              <Text style={styles.metricSub}>{filteredExpenses.length} entries</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL RECORDS</Text>
              <Text style={styles.metricValue}>{expenses.length}</Text>
              <Text style={styles.metricSub}>Saved entries</Text>
            </View>
          </View>

          {/* Inline Form Accordion */}
          {showForm && (
            <View style={styles.inlineFormCard}>
              <View style={styles.inlineFormHeader}>
                <View style={styles.inlineFormTitleRow}>
                  <View style={styles.formIconBadge}>
                    <ReceiptIcon size={18} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.inlineFormTitle}>Log New Expense</Text>
                    <Text style={styles.inlineFormSubtitle}>
                      Record miscellaneous payments, tolls, parking, and custom costs
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
                {/* Date & Amount */}
                <View style={styles.formGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>
                      Expense Date <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.datePickerTrigger}
                      activeOpacity={0.7}
                      onPress={(e: any) => {
                        e?.preventDefault?.();
                        setShowCalendar(true);
                      }}>
                      <CalendarIcon />
                      <Text style={styles.datePickerValueText}>{expenseDate || todayStr}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>
                      Amount (LKR) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.textInput, formErrors.amount && styles.inputError]}
                      placeholder="e.g. 1500"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                    {formErrors.amount && (
                      <Text style={styles.errorText}>{formErrors.amount}</Text>
                    )}
                  </View>
                </View>

                {/* Description & Quick Suggestions */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Description <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textInput, formErrors.description && styles.inputError]}
                    placeholder="e.g. Expressway Toll, Airport Parking, Car Wash"
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                  />
                  {formErrors.description && (
                    <Text style={styles.errorText}>{formErrors.description}</Text>
                  )}
                  <View style={styles.suggestionsRow}>
                    <Text style={styles.suggestionLabel}>Quick Pick:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
                        {DESCRIPTION_SUGGESTIONS.map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.suggestionChip,
                              description === item && styles.suggestionChipActive,
                            ]}
                            activeOpacity={0.7}
                            onPress={(e: any) => {
                              e?.preventDefault?.();
                              setDescription(item);
                            }}>
                            <Text
                              style={[
                                styles.suggestionChipText,
                                description === item && styles.suggestionChipTextActive,
                              ]}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                {/* Expense Category Pills */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Expense Category</Text>
                  <View style={styles.pillContainer}>
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.pillChip, isSelected && styles.pillChipSelected]}
                          activeOpacity={0.7}
                          onPress={(e: any) => {
                            e?.preventDefault?.();
                            setCategory(cat);
                          }}>
                          {isSelected && (
                            <View style={styles.pillChipCheck}>
                              <CheckIcon size={10} color="#FFFFFF" />
                            </View>
                          )}
                          <Text
                            style={[
                              styles.pillChipText,
                              isSelected && styles.pillChipTextSelected,
                            ]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Payment Method Pills */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Payment Method</Text>
                  <View style={styles.pillContainer}>
                    {PAYMENT_METHODS.map((pm) => {
                      const isSelected = paymentMethod === pm;
                      return (
                        <TouchableOpacity
                          key={pm}
                          style={[styles.pillChip, isSelected && styles.pillChipSelected]}
                          activeOpacity={0.7}
                          onPress={(e: any) => {
                            e?.preventDefault?.();
                            setPaymentMethod(pm);
                          }}>
                          {isSelected && (
                            <View style={styles.pillChipCheck}>
                              <CheckIcon size={10} color="#FFFFFF" />
                            </View>
                          )}
                          <Text
                            style={[
                              styles.pillChipText,
                              isSelected && styles.pillChipTextSelected,
                            ]}>
                            {pm}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    placeholder="Reference number, bill details, or invoice remarks..."
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
                        <Text style={styles.saveButtonText}>Save Expense</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Search & Filter Bar */}
          <View style={styles.filterSection}>
            <View style={styles.searchInputWrapper}>
              <SearchIcon size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search description, category, or payment method..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setSearch('');
                  }}
                  activeOpacity={0.7}>
                  <CloseIcon color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Category Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={styles.categoryChipsRow}>
                {FILTER_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      activeOpacity={0.7}
                      onPress={(e: any) => {
                        e?.preventDefault?.();
                        e?.stopPropagation?.();
                        setSelectedCategory(cat);
                      }}>
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* History Section Header */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Ledger Entries</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredExpenses.length} Records</Text>
            </View>
          </View>

          {/* Loading Indicator */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading expense records...</Text>
            </View>
          ) : filteredExpenses.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconBadge}>
                <ReceiptIcon size={36} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>
                {search || selectedCategory !== 'ALL'
                  ? 'No Matching Expenses Found'
                  : 'No Expenses Logged Yet 💳'}
              </Text>
              <Text style={styles.emptyMessage}>
                {search || selectedCategory !== 'ALL'
                  ? `No expense records matched the current filter (${selectedCategory}). Try choosing ALL or clearing search.`
                  : 'Record routine highway tolls, parking tickets, maintenance, and vehicle expenses. Click "+ Add Other" to log your first expense.'}
              </Text>
              {!(search || selectedCategory !== 'ALL') && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setShowForm(true);
                  }}>
                  <PlusIcon />
                  <Text style={styles.emptyActionBtnText}>+ Add First Expense</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Populated Ledger Cards */
            <View style={styles.recordsList}>
              {filteredExpenses.map((item) => {
                const badgeStyle = getCategoryBadgeStyle(item.category);
                return (
                  <View key={item.id} style={styles.recordCard}>
                    <View style={styles.recordRow}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <View style={styles.catBadgeRow}>
                          <View
                            style={[
                              styles.catBadge,
                              {
                                backgroundColor: badgeStyle.bg,
                                borderColor: badgeStyle.border,
                              },
                            ]}>
                            <Text style={[styles.catBadgeText, { color: badgeStyle.text }]}>
                              {item.category.toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.dateRow}>
                            <CalendarIcon color="#64748B" />
                            <Text style={styles.dateText}>{formatDate(item.expense_date)}</Text>
                          </View>
                          {item.payment_method && (
                            <View style={styles.paymentMethodTag}>
                              <Text style={styles.paymentMethodText}>
                                {item.payment_method}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.descriptionText} numberOfLines={2}>
                          {item.description}
                        </Text>
                        {Boolean(item.notes) && (
                          <Text style={styles.notesSubText} numberOfLines={1}>
                            Note: {item.notes}
                          </Text>
                        )}
                      </View>

                      {/* Right Amount & Delete Button */}
                      <View style={styles.recordRightSide}>
                        <Text style={styles.recordAmount}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <TouchableOpacity
                          style={styles.trashBtn}
                          activeOpacity={0.7}
                          onPress={(e) => handleDelete(item.id, e)}>
                          <TrashIcon size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Calendar Picker Modal */}
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModalContent}>
              {/* Calendar Header */}
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

              {/* Day of week abbreviations */}
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
                  const isSelected = expenseDate === d.dateStr;
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

              {/* Quick Actions */}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 18,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnActive: {
    backgroundColor: '#475569',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
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
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
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
    gap: 12,
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
    fontSize: 15,
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
    gap: 14,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCol: {
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
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
    fontSize: 13.5,
    color: '#0F172A',
  },
  textAreaInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
    fontWeight: '500',
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
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  suggestionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  suggestionLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  suggestionChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  suggestionChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pillChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillChipCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  pillChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  recordsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  paymentMethodTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentMethodText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  notesSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recordRightSide: {
    alignItems: 'flex-end',
    gap: 6,
  },
  recordAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  trashBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
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
});

