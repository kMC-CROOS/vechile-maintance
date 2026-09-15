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
import { formatCurrency, formatDate, formatOdometer } from '@/utils/format';

export interface FuelEntry {
  id: number;
  vehicle_id: number;
  fuel_date: string;
  quantity_litres: number | string;
  price_per_unit: number | string;
  total_cost: number | string;
  odometer: number | string;
  fuel_station?: string | null;
  fill_type: 'full' | 'partial';
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

const FuelPumpIcon = ({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 21H15M4 21V5C4 3.89543 4.89543 3 6 3H12C13.1046 3 14 3.89543 14 5V21M7 7H11M14 9H16.5C17.3284 9 18 9.67157 18 10.5V14.5C18 15.3284 18.6716 16 19.5 16C20.3284 16 21 15.3284 21 14.5V8.5L19 6.5"
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

const STATION_SUGGESTIONS = ['CEYPETCO', 'Lanka IOC', 'Sinopec', 'Shell'];
const STORAGE_KEY = 'vehiclecare_fuel_logs_list';

export default function FuelTab() {
  const { activeVehicle, reloadVehicles } = useVehicle();
  const params = useLocalSearchParams<{ openAdd?: string }>();

  // Initialize entries from cache if available
  const [entries, setEntries] = useState<FuelEntry[]>(() => {
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

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [fuelDate, setFuelDate] = useState(todayStr);
  const [quantityLitres, setQuantityLitres] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [odometer, setOdometer] = useState(activeVehicle ? String(activeVehicle.current_odometer || 4200) : '4200');
  const [fuelStation, setFuelStation] = useState('');
  const [fillType, setFillType] = useState<'full' | 'partial'>('full');
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

  // Sync odometer with activeVehicle default if available
  useEffect(() => {
    if (activeVehicle?.current_odometer && (!odometer || odometer === '4200')) {
      setOdometer(String(activeVehicle.current_odometer));
    }
  }, [activeVehicle]);

  // Sync entries to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {}
    }
  }, [entries]);

  // Fetch fuel entries from backend if activeVehicle exists with in-memory caching
  const fetchEntries = useCallback(async (force = false) => {
    if (!activeVehicle?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cacheKey = `fuel_${activeVehicle.id}`;
    if (!force) {
      const cached = dataCache.get<FuelEntry[]>(cacheKey, 60000);
      if (cached && cached.length > 0) {
        setEntries(cached);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

    try {
      const data = await apiFetch<FuelEntry[]>(`/vehicles/${activeVehicle.id}/fuel`);
      if (Array.isArray(data)) {
        setEntries((prev) => {
          // Merge server data with any existing local-only logs
          const serverIds = new Set(data.map((d) => d.id));
          const localOnly = prev.filter((p) => !serverIds.has(p.id) && String(p.id).length > 10);
          const merged = [...localOnly, ...data];
          dataCache.set(cacheKey, merged);
          return merged;
        });
      }
    } catch {
      // Gracefully keep cached/state entries
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeVehicle?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries(false);
    }, [fetchEntries])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEntries(true);
  }, [fetchEntries]);

  // Live calculation
  const litresNum = parseFloat(quantityLitres) || 0;
  const priceNum = parseFloat(pricePerUnit) || 0;
  const liveTotal = litresNum * priceNum;

  // Stats calculation
  const totalLitresSum = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (parseFloat(String(curr.quantity_litres)) || 0), 0);
  }, [entries]);

  const totalCostSum = useMemo(() => {
    return entries.reduce((acc, curr) => acc + (parseFloat(String(curr.total_cost)) || 0), 0);
  }, [entries]);

  // Handle Form Submission: ALWAYS adds to state, updates history, closes form
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const errors: Record<string, string> = {};
    if (!fuelDate.trim()) errors.fuelDate = 'Fuel date is required.';
    if (!quantityLitres.trim() || litresNum <= 0) errors.quantity = 'Valid quantity in litres is required.';
    if (!pricePerUnit.trim() || priceNum <= 0) errors.price = 'Valid price per litre is required.';
    if (!odometer.trim() || isNaN(Number(odometer)) || Number(odometer) < 0) {
      errors.odometer = 'Valid odometer reading (KM) is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    const calculatedTotal = Math.round(litresNum * priceNum * 100) / 100;
    const newEntry: FuelEntry = {
      id: Date.now(),
      vehicle_id: activeVehicle?.id || 1,
      fuel_date: fuelDate.trim() || todayStr,
      quantity_litres: litresNum,
      price_per_unit: priceNum,
      total_cost: calculatedTotal,
      odometer: Number(odometer) || 0,
      fuel_station: fuelStation.trim() || 'Fuel Station',
      fill_type: fillType,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    // 1. Instantly append to state array so the history list updates immediately!
    setEntries((prev) => [newEntry, ...prev]);

    // 2. Reset form fields and collapse inline form
    setQuantityLitres('');
    setPricePerUnit('');
    setFuelStation('');
    setNotes('');
    setFillType('full');
    setFuelDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
    setSubmitting(false);

    // 3. If connected to an active vehicle, sync with backend API in background
    if (activeVehicle?.id) {
      try {
        const response = await apiFetch<FuelEntry>(`/vehicles/${activeVehicle.id}/fuel`, {
          method: 'POST',
          body: {
            fuel_date: newEntry.fuel_date,
            quantity_litres: newEntry.quantity_litres,
            price_per_unit: newEntry.price_per_unit,
            odometer: newEntry.odometer,
            fuel_station: newEntry.fuel_station,
            fill_type: newEntry.fill_type,
            notes: newEntry.notes,
          },
        });

        if (response && response.id) {
          // Replace temporary timestamp id with official backend id
          setEntries((prev) => prev.map((item) => (item.id === newEntry.id ? response : item)));
        }

        if (reloadVehicles) {
          await reloadVehicles(activeVehicle.id);
        }
        dataCache.invalidate('fuel_');
      } catch {
        // Entry is safely maintained in state array and localStorage cache
      }
    }
  };

  // Delete Functionality: Instantly removes entry from state array
  const handleDelete = async (id: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // 1. Instantly remove from React state array
    setEntries((prev) => prev.filter((item) => item.id !== id));
    dataCache.invalidate('fuel_');

    // 2. In background, attempt backend delete if it has a backend record
    try {
      await apiFetch(`/fuel/${id}`, { method: 'DELETE' });
      if (activeVehicle?.id && reloadVehicles) {
        await reloadVehicles(activeVehicle.id);
      }
    } catch {
      // Local deletion remains in effect
    }
  };

  // Calendar Helpers
  const currentMonthYearLabel = useMemo(() => {
    return calendarCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarCursor]);

  const calendarDays = useMemo(() => {
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  }, [calendarCursor]);

  const handleSelectDay = (day: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const year = calendarCursor.getFullYear();
    const month = String(calendarCursor.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setFuelDate(`${year}-${month}-${d}`);
    setShowCalendar(false);
  };

  const handlePrevMonth = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSetPresetDate = (daysAgo: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    setFuelDate(target.toISOString().split('T')[0]);
    setCalendarCursor(target);
    setShowCalendar(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Fuel Logs</Text>
            {activeVehicle ? (
              <Text style={styles.headerSubtitle}>
                {activeVehicle.brand} {activeVehicle.model} ({activeVehicle.registration_number})
              </Text>
            ) : (
              <Text style={styles.headerSubtitle}>Track refill history & fuel economy</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.toggleFormBtn, showForm && styles.toggleFormBtnActive]}
            activeOpacity={0.8}
            onPress={(e: any) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              setFormErrors({});
              setShowForm((prev) => !prev);
            }}>
            {showForm ? (
              <>
                <CloseIcon color="#2563EB" />
                <Text style={styles.toggleFormBtnTextActive}>Close Form</Text>
              </>
            ) : (
              <>
                <PlusIcon />
                <Text style={styles.toggleFormBtnText}>Log Fuel Fill</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchEntries();
              }}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }>
          {/* INLINE FORM VIEW */}
          {showForm && (
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View style={styles.formHeaderLeft}>
                  <View style={styles.formIconBadge}>
                    <FuelPumpIcon size={18} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.formTitle}>New Fuel Refill</Text>
                    <Text style={styles.formSubtitle}>Enter log details and review calculation</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.formCloseTouch}
                  activeOpacity={0.7}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setShowForm(false);
                  }}>
                  <CloseIcon color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Fueling Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fueling Date (YYYY-MM-DD) *</Text>
                <View
                  style={[
                    styles.dateInputContainer,
                    formErrors.fuelDate ? styles.inputErrorBorder : null,
                  ]}>
                  <TextInput
                    style={styles.dateTextInput}
                    value={fuelDate}
                    onChangeText={setFuelDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    style={styles.calendarButton}
                    activeOpacity={0.7}
                    onPress={(e: any) => {
                      e?.preventDefault?.();
                      try {
                        const parsed = new Date(fuelDate);
                        if (!isNaN(parsed.getTime())) {
                          setCalendarCursor(parsed);
                        }
                      } catch {}
                      setShowCalendar(true);
                    }}>
                    <CalendarIcon color="#2563EB" />
                  </TouchableOpacity>
                </View>
                {formErrors.fuelDate && <Text style={styles.errorText}>{formErrors.fuelDate}</Text>}
              </View>

              {/* Quantity & Price Row */}
              <View style={styles.rowGrid}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity (Litres) *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.monoInput,
                      formErrors.quantity ? styles.inputErrorBorder : null,
                    ]}
                    value={quantityLitres}
                    onChangeText={setQuantityLitres}
                    placeholder="e.g. 35.5"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                  {formErrors.quantity && <Text style={styles.errorText}>{formErrors.quantity}</Text>}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Price Per Litre (LKR) *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.monoInput,
                      formErrors.price ? styles.inputErrorBorder : null,
                    ]}
                    value={pricePerUnit}
                    onChangeText={setPricePerUnit}
                    placeholder="e.g. 370.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                  {formErrors.price && <Text style={styles.errorText}>{formErrors.price}</Text>}
                </View>
              </View>

              {/* LIVE CALCULATED TOTAL BANNER */}
              <View style={styles.liveBanner}>
                <View style={styles.liveBannerHeader}>
                  <Text style={styles.liveBannerBadge}>LIVE CALCULATED TOTAL</Text>
                  {litresNum > 0 && priceNum > 0 && (
                    <Text style={styles.liveFormulaText}>
                      {litresNum} L × {formatCurrency(priceNum)}
                    </Text>
                  )}
                </View>
                <Text style={styles.liveBannerAmount}>{formatCurrency(liveTotal)}</Text>
              </View>

              {/* Current Odometer */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Odometer (KM) *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.monoInput,
                    formErrors.odometer ? styles.inputErrorBorder : null,
                  ]}
                  value={odometer}
                  onChangeText={setOdometer}
                  placeholder="e.g. 4200"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
                {formErrors.odometer && <Text style={styles.errorText}>{formErrors.odometer}</Text>}
              </View>

              {/* Fuel Station Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fuel Station Name (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fuelStation}
                  onChangeText={setFuelStation}
                  placeholder="e.g. CEYPETCO / Lanka IOC / Shell"
                  placeholderTextColor="#94A3B8"
                />
                {/* Station Suggestion Chips */}
                <View style={styles.chipRow}>
                  {STATION_SUGGESTIONS.map((station) => (
                    <TouchableOpacity
                      key={station}
                      style={[
                        styles.stationChip,
                        fuelStation === station && styles.stationChipActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={(e: any) => {
                        e?.preventDefault?.();
                        setFuelStation(station);
                      }}>
                      <Text
                        style={[
                          styles.stationChipText,
                          fuelStation === station && styles.stationChipTextActive,
                        ]}>
                        {station}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fill Type selection pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fill Type</Text>
                <View style={styles.pillContainer}>
                  <TouchableOpacity
                    style={[styles.typePill, fillType === 'full' && styles.typePillActive]}
                    activeOpacity={0.8}
                    onPress={(e: any) => {
                      e?.preventDefault?.();
                      setFillType('full');
                    }}>
                    <Text style={[styles.typePillText, fillType === 'full' && styles.typePillTextActive]}>
                      ⛽ Full Tank
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typePill, fillType === 'partial' && styles.typePillActive]}
                    activeOpacity={0.8}
                    onPress={(e: any) => {
                      e?.preventDefault?.();
                      setFillType('partial');
                    }}>
                    <Text
                      style={[
                        styles.typePillText,
                        fillType === 'partial' && styles.typePillTextActive,
                      ]}>
                      💧 Partial Fill
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Octane 95, Highway rest stop"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Submit Buttons */}
              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setShowForm(false);
                  }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.btnDisabled]}
                  activeOpacity={0.85}
                  disabled={submitting}
                  onPress={handleSave}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Fuel Log</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingLabel}>Loading fuel records...</Text>
            </View>
          ) : entries.length === 0 ? (
            /* EMPTY STATE VIEW */
            !showForm && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyEmoji}>⛽</Text>
                </View>
                <Text style={styles.emptyTitle}>No Fuel Logs Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Track fuel refills, mileage efficiency, and fuel costs.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.85}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setFormErrors({});
                    setShowForm(true);
                  }}>
                  <PlusIcon />
                  <Text style={styles.emptyActionBtnText}>+ Log Fuel Fill</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            /* POPULATED STATE: Structured History List */
            <View style={styles.populatedContainer}>
              {/* Summary Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>TOTAL FUEL</Text>
                  <Text style={styles.statValue}>{totalLitresSum.toFixed(1)} L</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>TOTAL SPENT</Text>
                  <Text style={[styles.statValue, styles.statValueBlue]}>
                    {formatCurrency(totalCostSum)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>TOTAL FILLS</Text>
                  <Text style={styles.statValue}>{entries.length}</Text>
                </View>
              </View>

              {/* Entries List */}
              <View style={styles.entriesSection}>
                <Text style={styles.sectionHeaderTitle}>Fuel Logs History</Text>
                {entries.map((item) => (
                  <View key={item.id} style={styles.entryCard}>
                    {/* Item Top Row: Station, Date, Fill Badge, and Delete Button */}
                    <View style={styles.entryTopRow}>
                      <View style={styles.entryStationWrapper}>
                        <View style={styles.entryStationHeaderRow}>
                          <View style={styles.entryIconMini}>
                            <FuelPumpIcon size={14} color="#2563EB" />
                          </View>
                          <Text style={styles.entryStationName}>
                            {item.fuel_station?.trim() || 'Fuel Refill'}
                          </Text>
                        </View>
                        <Text style={styles.entryDate}>{formatDate(item.fuel_date)}</Text>
                      </View>

                      <View style={styles.entryTopRight}>
                        <View
                          style={[
                            styles.badgePill,
                            item.fill_type === 'full' ? styles.badgeFull : styles.badgePartial,
                          ]}>
                          <Text
                            style={[
                              styles.badgePillText,
                              item.fill_type === 'full'
                                ? styles.badgeFullText
                                : styles.badgePartialText,
                            ]}>
                            {item.fill_type === 'full' ? 'Full Tank' : 'Partial Fill'}
                          </Text>
                        </View>

                        {/* DELETE BUTTON (Trash/Bin Icon) */}
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete fuel log"
                          onPress={(e) => handleDelete(item.id, e)}>
                          <TrashIcon size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.entryDivider} />

                    {/* Item Details Row: Volume, Price, Odometer, Total Cost */}
                    <View style={styles.entryDetailsRow}>
                      <View style={styles.entryMetric}>
                        <Text style={styles.entryMetricLabel}>Volume</Text>
                        <Text style={styles.entryMetricVal}>
                          {parseFloat(String(item.quantity_litres)).toFixed(2)} L
                        </Text>
                      </View>

                      <View style={styles.entryMetric}>
                        <Text style={styles.entryMetricLabel}>Price / L</Text>
                        <Text style={styles.entryMetricVal}>
                          {formatCurrency(item.price_per_unit)}
                        </Text>
                      </View>

                      <View style={styles.entryMetric}>
                        <Text style={styles.entryMetricLabel}>Odometer</Text>
                        <Text style={styles.entryMetricVal}>
                          {formatOdometer(item.odometer)}
                        </Text>
                      </View>

                      <View style={[styles.entryMetric, { alignItems: 'flex-end' }]}>
                        <Text style={styles.entryMetricLabel}>Total Cost</Text>
                        <Text style={styles.entryTotalCost}>
                          {formatCurrency(item.total_cost)}
                        </Text>
                      </View>
                    </View>

                    {item.notes ? (
                      <View style={styles.entryNotesBox}>
                        <Text style={styles.entryNotesText}>📝 {item.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* CALENDAR PICKER MODAL */}
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={(e: any) => {
              e?.preventDefault?.();
              setShowCalendar(false);
            }}>
            <TouchableOpacity
              style={styles.calendarModalContent}
              activeOpacity={1}
              onPress={(e: any) => e?.stopPropagation?.()}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  activeOpacity={0.7}
                  onPress={handlePrevMonth}>
                  <ChevronLeftIcon />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>{currentMonthYearLabel}</Text>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  activeOpacity={0.7}
                  onPress={handleNextMonth}>
                  <ChevronRightIcon />
                </TouchableOpacity>
              </View>

              {/* Days of week header */}
              <View style={styles.weekdaysRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
                  <Text key={idx} style={styles.weekdayLabel}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Month days grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={idx} style={styles.dayCellEmpty} />;
                  }

                  const curYear = calendarCursor.getFullYear();
                  const curMonth = String(calendarCursor.getMonth() + 1).padStart(2, '0');
                  const curDayStr = `${curYear}-${curMonth}-${String(day).padStart(2, '0')}`;
                  const isSelected = fuelDate === curDayStr;
                  const isToday = todayStr === curDayStr;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                      activeOpacity={0.7}
                      onPress={(e: any) => handleSelectDay(day, e)}>
                      <Text
                        style={[
                          styles.dayCellText,
                          isSelected && styles.dayCellTextSelected,
                          isToday && !isSelected && styles.dayCellTextToday,
                        ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Presets */}
              <View style={styles.calendarFooter}>
                <TouchableOpacity
                  style={styles.calPresetBtn}
                  activeOpacity={0.7}
                  onPress={(e: any) => handleSetPresetDate(0, e)}>
                  <Text style={styles.calPresetText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calPresetBtn}
                  activeOpacity={0.7}
                  onPress={(e: any) => handleSetPresetDate(1, e)}>
                  <Text style={styles.calPresetText}>Yesterday</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calPresetBtn, styles.calCloseBtn]}
                  activeOpacity={0.7}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setShowCalendar(false);
                  }}>
                  <Text style={styles.calCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
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

  // Screen Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  toggleFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleFormBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowOpacity: 0,
    elevation: 0,
  },
  toggleFormBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleFormBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },

  // Scroll View
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 820,
    width: '100%',
    alignSelf: 'center',
  },

  // Inline Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  formHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  formCloseTouch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  monoInput: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '600',
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },

  // Date Container
  dateInputContainer: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '600',
  },
  calendarButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Row Grid
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  // Live Calculated Total Banner
  liveBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  liveBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  liveBannerBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.6,
  },
  liveFormulaText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  liveBannerAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E40AF',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
  },

  // Station Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  stationChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stationChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  stationChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stationChipTextActive: {
    color: '#1D4ED8',
  },

  // Fill Type Pills
  pillContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typePill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },

  // Action Buttons Row
  formButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Loading View
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
    marginBottom: 22,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Populated State
  populatedContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statValueBlue: {
    color: '#2563EB',
  },

  // Refill History Entries
  entriesSection: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  entryStationWrapper: {
    flex: 1,
    marginRight: 10,
  },
  entryStationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryIconMini: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryStationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  entryDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  entryTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeFull: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgePartial: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeFullText: {
    color: '#1D4ED8',
  },
  badgePartialText: {
    color: '#475569',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  entryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  entryDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryMetric: {
    flex: 1,
  },
  entryMetricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  entryMetricVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  entryTotalCost: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2563EB',
  },

  entryNotesBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  entryNotesText: {
    fontSize: 12,
    color: '#475569',
  },

  // Calendar Modal
  modalBackdrop: {
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 6,
  },
  weekdayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    marginVertical: 2,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayCellTextToday: {
    color: '#2563EB',
    fontWeight: '800',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  calPresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  calCloseBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  calCloseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});
