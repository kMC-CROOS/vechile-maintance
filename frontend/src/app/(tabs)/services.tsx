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

export interface ServiceRecord {
  id: number;
  vehicle_id?: number;
  service_date: string;
  odometer: number | string;
  workshop_name?: string | null;
  mechanic_name?: string | null;
  mechanic_phone?: string | null;
  total_cost: number | string;
  next_service_due_odometer?: number | string | null;
  services_performed: string[];
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

const WrenchIcon = ({ size = 20, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

const PhoneIcon = ({ size = 13, color = '#64748B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92V19.92C22 20.4728 21.5528 20.92 21 20.92C11.6112 20.92 4 13.3088 4 3.92C4 3.36716 4.44716 2.92 5 2.92H8C8.55228 2.92 9 3.36716 9 3.92C9 5.25333 9.25 6.54667 9.71 7.73C9.84 8.06333 9.75 8.44667 9.49 8.71L7.84 10.36C9.69 13.61 12.39 16.31 15.64 18.16L17.29 16.51C17.55 16.25 17.94 16.16 18.27 16.29C19.45 16.75 20.75 17 22.08 17C22.6328 17 22.08 17.4472 22.08 18V16.92Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SERVICE_OPTIONS = [
  'Engine Oil',
  'Oil Filter',
  'Air Filter',
  'Coolant',
  'Brake Pads',
  'General Service',
  'Tyre Rotation',
  'Spark Plugs',
  'Battery Check',
  'Wheel Alignment',
  'Transmission Fluid',
  'Brake Oil',
  'Other',
];

const WORKSHOP_SUGGESTIONS = [
  'AutoMiraj',
  'Toyota Lanka',
  'Sterling Aftercare',
  'Mobil 1 Lube Center',
  'Kavinda Auto Care',
  'Local Garage',
];

const STORAGE_KEY = 'vehiclecare_service_records_list';

export default function ServicesScreen() {
  const { activeVehicle, reloadVehicles } = useVehicle();
  const params = useLocalSearchParams<{ openAdd?: string }>();

  // Initialize service records from cache if available
  const [services, setServices] = useState<ServiceRecord[]>(() => {
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

  // Loading defaults to false so it never blocks UI with an infinite spinner
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [serviceDate, setServiceDate] = useState(todayStr);
  const [odometer, setOdometer] = useState(
    activeVehicle ? String(activeVehicle.current_odometer || 4500) : '4500'
  );
  const [workshopName, setWorkshopName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicPhone, setMechanicPhone] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [nextDueOdometer, setNextDueOdometer] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Engine Oil',
    'General Service',
  ]);
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
    if (activeVehicle?.current_odometer && (!odometer || odometer === '4500')) {
      const current = String(activeVehicle.current_odometer);
      setOdometer(current);
      if (!nextDueOdometer) {
        setNextDueOdometer(String(activeVehicle.current_odometer + 5000));
      }
    }
  }, [activeVehicle]);

  // Auto calculate next due odometer (+5000 KM) when odometer changes if empty
  const handleOdometerChange = (val: string) => {
    setOdometer(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setNextDueOdometer(String(num + 5000));
    }
  };

  // Sync service records to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
      } catch {}
    }
  }, [services]);

  // Fetch service records from backend gracefully with in-memory caching
  const fetchServices = useCallback(async (force = false) => {
    if (!activeVehicle?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cacheKey = `services_${activeVehicle.id}`;
    if (!force) {
      const cached = dataCache.get<ServiceRecord[]>(cacheKey, 60000);
      if (cached && cached.length > 0) {
        setServices(cached);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    }

    try {
      const data = await apiFetch<any[]>(`/vehicles/${activeVehicle.id}/services`);
      if (Array.isArray(data)) {
        setServices((prev) => {
          // Normalize server items to format
          const formattedServerData: ServiceRecord[] = data.map((item) => ({
            id: item.id,
            vehicle_id: item.vehicle_id || activeVehicle.id,
            service_date: item.service_date || todayStr,
            odometer: item.odometer,
            workshop_name: item.workshop_name,
            mechanic_name: item.mechanic_name,
            mechanic_phone: item.mechanic_phone,
            total_cost: item.total_cost,
            next_service_due_odometer: item.next_service_due_odometer,
            services_performed: Array.isArray(item.services_performed)
              ? item.services_performed
              : item.services_performed
              ? [String(item.services_performed)]
              : [],
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
      // Gracefully maintain cached entries without breaking
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeVehicle?.id, todayStr]);

  useFocusEffect(
    useCallback(() => {
      fetchServices(false);
    }, [fetchServices])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices(true);
  }, [fetchServices]);

  // Toggle service chip selection
  const toggleServiceChip = (serviceName: string, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
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
    setFuelDateSafe(dateStr);
    setShowCalendar(false);
  };

  const setFuelDateSafe = (d: string) => {
    setServiceDate(d);
  };

  // Save Service Record
  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const errors: Record<string, string> = {};
    const costNum = Number(totalCost);
    const odoNum = Number(odometer);

    if (!odometer.trim() || isNaN(odoNum) || odoNum < 0) {
      errors.odometer = 'Valid odometer reading (KM) is required.';
    }
    if (!totalCost.trim() || isNaN(costNum) || costNum < 0) {
      errors.totalCost = 'Valid total cost is required.';
    }
    if (selectedServices.length === 0) {
      errors.services = 'Please select at least one service performed.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);

    const newRecord: ServiceRecord = {
      id: Date.now(),
      vehicle_id: activeVehicle?.id || 1,
      service_date: serviceDate.trim() || todayStr,
      odometer: odoNum,
      workshop_name: workshopName.trim() || 'General Workshop',
      mechanic_name: mechanicName.trim() || undefined,
      mechanic_phone: mechanicPhone.trim() || undefined,
      total_cost: costNum,
      next_service_due_odometer: nextDueOdometer.trim() ? Number(nextDueOdometer) : undefined,
      services_performed: selectedServices,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    // 1. Instantly append to state array so the history list updates immediately!
    setServices((prev) => [newRecord, ...prev]);

    // 2. Reset form fields and collapse inline form
    setWorkshopName('');
    setMechanicName('');
    setMechanicPhone('');
    setTotalCost('');
    setNextDueOdometer('');
    setSelectedServices(['Engine Oil', 'General Service']);
    setNotes('');
    setServiceDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
    setSubmitting(false);

    // 3. If connected to an active vehicle, sync with backend API in background
    if (activeVehicle?.id) {
      try {
        const response = await apiFetch<any>(`/vehicles/${activeVehicle.id}/services`, {
          method: 'POST',
          body: {
            service_date: newRecord.service_date,
            odometer: Number(newRecord.odometer),
            workshop_name: newRecord.workshop_name,
            mechanic_name: newRecord.mechanic_name,
            mechanic_phone: newRecord.mechanic_phone,
            total_cost: Number(newRecord.total_cost),
            services_performed: newRecord.services_performed,
            next_service_due_odometer: newRecord.next_service_due_odometer
              ? Number(newRecord.next_service_due_odometer)
              : undefined,
            notes: newRecord.notes,
          },
        });

        if (response && response.id) {
          setServices((prev) =>
            prev.map((item) => (item.id === newRecord.id ? { ...newRecord, id: response.id } : item))
          );
        }

        if (reloadVehicles) {
          await reloadVehicles(activeVehicle.id);
        }
        dataCache.invalidate('services_');
      } catch {
        // Record safely maintained in state array and localStorage cache
      }
    }
  };

  // Delete Functionality: Instantly removes entry from state array
  const handleDelete = async (id: number, e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // Remove immediately from UI
    setServices((prev) => prev.filter((item) => item.id !== id));
    dataCache.invalidate('services_');

    // Non-blocking background deletion
    try {
      if (activeVehicle?.id) {
        await apiFetch(`/services/${id}`, { method: 'DELETE' });
      }
    } catch {
      // Offline fallback: entry remains removed from local state
    }
  };

  // Filtered Services List (search active)
  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => {
      const workshopMatch = (s.workshop_name || '').toLowerCase().includes(q);
      const notesMatch = (s.notes || '').toLowerCase().includes(q);
      const mechanicMatch = (s.mechanic_name || '').toLowerCase().includes(q);
      const servicesMatch = Array.isArray(s.services_performed)
        ? s.services_performed.some((tag) => tag.toLowerCase().includes(q))
        : false;
      return workshopMatch || notesMatch || mechanicMatch || servicesMatch;
    });
  }, [services, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = services.length;
    let totalSpent = 0;
    let lastOdometer = 0;
    let nextDue: number | null = null;

    services.forEach((s) => {
      totalSpent += Number(s.total_cost) || 0;
      const odo = Number(s.odometer) || 0;
      if (odo > lastOdometer) lastOdometer = odo;
      if (s.next_service_due_odometer) {
        const due = Number(s.next_service_due_odometer);
        if (due > 0 && (nextDue === null || due < nextDue)) {
          nextDue = due;
        }
      }
    });

    return {
      totalCount,
      totalSpent,
      lastOdometer,
      nextDue,
    };
  }, [services]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Service Records</Text>
            <Text style={styles.subtitle}>
              {activeVehicle
                ? `${activeVehicle.brand || ''} ${activeVehicle.model || ''} (${activeVehicle.registration_number || ''})`.trim()
                : 'Track vehicle maintenance & workshop history'}
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
                <Text style={styles.addBtnText}>+ Log Service</Text>
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
              <Text style={styles.metricLabel}>TOTAL SERVICES</Text>
              <Text style={styles.metricValue}>{metrics.totalCount}</Text>
              <Text style={styles.metricSub}>Recorded entries</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL SPENT</Text>
              <Text style={[styles.metricValue, { color: '#2563EB' }]}>
                {formatCurrency(metrics.totalSpent)}
              </Text>
              <Text style={styles.metricSub}>Maintenance cost</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>LAST SERVICE</Text>
              <Text style={styles.metricValue}>
                {metrics.lastOdometer ? formatOdometer(metrics.lastOdometer) : '—'}
              </Text>
              <Text style={styles.metricSub}>
                {metrics.nextDue ? `Next: ${formatOdometer(metrics.nextDue)}` : 'Odometer at service'}
              </Text>
            </View>
          </View>

          {/* Inline Form Accordion */}
          {showForm && (
            <View style={styles.inlineFormCard}>
              <View style={styles.inlineFormHeader}>
                <View style={styles.inlineFormTitleRow}>
                  <View style={styles.formIconBadge}>
                    <WrenchIcon size={18} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.inlineFormTitle}>Log New Service Record</Text>
                    <Text style={styles.inlineFormSubtitle}>
                      Record workshop details, services performed, and maintenance cost
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
                {/* Service Date & Odometer */}
                <View style={styles.formGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>
                      Service Date <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.datePickerTrigger}
                      activeOpacity={0.7}
                      onPress={(e: any) => {
                        e?.preventDefault?.();
                        setShowCalendar(true);
                      }}>
                      <CalendarIcon />
                      <Text style={styles.datePickerValueText}>{serviceDate || todayStr}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>
                      Service Odometer (KM) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.textInput, formErrors.odometer && styles.inputError]}
                      placeholder="e.g. 15400"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={odometer}
                      onChangeText={handleOdometerChange}
                    />
                    {formErrors.odometer && (
                      <Text style={styles.errorText}>{formErrors.odometer}</Text>
                    )}
                  </View>
                </View>

                {/* Workshop Name & Suggestions */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Workshop / Garage Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. AutoMiraj, Toyota Lanka, Local Garage"
                    placeholderTextColor="#94A3B8"
                    value={workshopName}
                    onChangeText={setWorkshopName}
                  />
                  <View style={styles.suggestionsRow}>
                    <Text style={styles.suggestionLabel}>Suggestions:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
                        {WORKSHOP_SUGGESTIONS.map((w) => (
                          <TouchableOpacity
                            key={w}
                            style={[
                              styles.suggestionChip,
                              workshopName === w && styles.suggestionChipActive,
                            ]}
                            activeOpacity={0.7}
                            onPress={(e: any) => {
                              e?.preventDefault?.();
                              setWorkshopName(w);
                            }}>
                            <Text
                              style={[
                                styles.suggestionChipText,
                                workshopName === w && styles.suggestionChipTextActive,
                              ]}>
                              {w}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                {/* Mechanic Name & Phone */}
                <View style={styles.formGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Mechanic Name (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Ruwan Silva"
                      placeholderTextColor="#94A3B8"
                      value={mechanicName}
                      onChangeText={setMechanicName}
                    />
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Mechanic Phone (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 0771234567"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={mechanicPhone}
                      onChangeText={setMechanicPhone}
                    />
                  </View>
                </View>

                {/* Total Cost & Next Due Odometer */}
                <View style={styles.formGrid}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>
                      Total Cost (LKR) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.textInput, formErrors.totalCost && styles.inputError]}
                      placeholder="e.g. 18500"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={totalCost}
                      onChangeText={setTotalCost}
                    />
                    {formErrors.totalCost && (
                      <Text style={styles.errorText}>{formErrors.totalCost}</Text>
                    )}
                  </View>

                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Next Service Due Odometer (KM)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 20400"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={nextDueOdometer}
                      onChangeText={setNextDueOdometer}
                    />
                    <Text style={styles.helperText}>Recommended +5,000 KM interval</Text>
                  </View>
                </View>

                {/* Services Performed Multi-Select Chips */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.inputLabel}>
                      Services Performed <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <Text style={styles.selectedCountText}>
                      {selectedServices.length} selected
                    </Text>
                  </View>
                  <View style={styles.servicesGrid}>
                    {SERVICE_OPTIONS.map((item) => {
                      const isSelected = selectedServices.includes(item);
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[styles.serviceChip, isSelected && styles.serviceChipSelected]}
                          activeOpacity={0.7}
                          onPress={(e) => toggleServiceChip(item, e)}>
                          {isSelected && (
                            <View style={styles.serviceChipCheck}>
                              <CheckIcon size={10} color="#FFFFFF" />
                            </View>
                          )}
                          <Text
                            style={[
                              styles.serviceChipText,
                              isSelected && styles.serviceChipTextSelected,
                            ]}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {formErrors.services && (
                    <Text style={styles.errorText}>{formErrors.services}</Text>
                  )}
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    placeholder="Specific parts changed, lubricant brand, warranty details..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
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
                        <Text style={styles.saveButtonText}>Save Service Record</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Search & Section Title */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputWrapper}>
              <SearchIcon size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search workshop, service, or mechanic..."
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
          </View>

          {/* Service Records History List */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Service History</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredServices.length} Records</Text>
            </View>
          </View>

          {/* Loading Indicator */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading service records...</Text>
            </View>
          ) : filteredServices.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconBadge}>
                <WrenchIcon size={36} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? 'No Matching Records Found' : 'No Service Records Yet 🔧'}
              </Text>
              <Text style={styles.emptyMessage}>
                {search
                  ? `No service records found matching "${search}". Try checking for typos or clear your search query.`
                  : 'Track routine oil changes, parts replacements, and workshop visits. Click "+ Log Service" to add your first record.'}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={(e: any) => {
                    e?.preventDefault?.();
                    setShowForm(true);
                  }}>
                  <PlusIcon />
                  <Text style={styles.emptyActionBtnText}>+ Log First Service</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Populated History Cards */
            <View style={styles.recordsList}>
              {filteredServices.map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  {/* Card Header */}
                  <View style={styles.recordHeader}>
                    <View style={styles.recordHeaderLeft}>
                      <View style={styles.recordIconCircle}>
                        <WrenchIcon size={18} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordWorkshopName} numberOfLines={1}>
                          {record.workshop_name || 'General Workshop'}
                        </Text>
                        <View style={styles.recordDateRow}>
                          <CalendarIcon color="#64748B" />
                          <Text style={styles.recordDateText}>{formatDate(record.service_date)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Cost & Delete Button */}
                    <View style={styles.recordHeaderRight}>
                      <Text style={styles.recordCost}>
                        {formatCurrency(record.total_cost)}
                      </Text>
                      <TouchableOpacity
                        style={styles.trashBtn}
                        activeOpacity={0.7}
                        onPress={(e) => handleDelete(record.id, e)}>
                        <TrashIcon size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Odometer & Mechanic Details */}
                  <View style={styles.recordDetailsRow}>
                    <View style={styles.detailBlock}>
                      <Text style={styles.detailLabel}>ODOMETER</Text>
                      <Text style={styles.detailValue}>{formatOdometer(record.odometer)}</Text>
                    </View>

                    {record.next_service_due_odometer && (
                      <View style={styles.detailBlock}>
                        <Text style={styles.detailLabel}>NEXT DUE</Text>
                        <View style={styles.nextDueBadge}>
                          <Text style={styles.nextDueText}>
                            {formatOdometer(record.next_service_due_odometer)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {record.mechanic_name && (
                      <View style={styles.detailBlock}>
                        <Text style={styles.detailLabel}>MECHANIC</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {record.mechanic_name}
                        </Text>
                        {record.mechanic_phone && (
                          <View style={styles.phoneRow}>
                            <PhoneIcon size={11} color="#64748B" />
                            <Text style={styles.phoneText}>{record.mechanic_phone}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Services Performed Pill Chips */}
                  {Array.isArray(record.services_performed) &&
                    record.services_performed.length > 0 && (
                      <View style={styles.recordChipsContainer}>
                        {record.services_performed.map((serviceName: string) => (
                          <View key={serviceName} style={styles.serviceTag}>
                            <View style={styles.serviceTagDot} />
                            <Text style={styles.serviceTagText}>
                              {serviceName.replace(/_/g, ' ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                  {/* Notes if present */}
                  {Boolean(record.notes) && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesText}>{record.notes}</Text>
                    </View>
                  )}
                </View>
              ))}
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
                  const isSelected = serviceDate === d.dateStr;
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
    minHeight: 70,
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
  helperText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 3,
  },
  selectedCountText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2563EB',
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  serviceChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  serviceChipCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  serviceChipTextSelected: {
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
  searchSection: {
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
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  recordIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordWorkshopName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  recordDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  recordDateText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  recordHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  recordCost: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#2563EB',
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
  recordDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailBlock: {
    minWidth: 80,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  nextDueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  nextDueText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 11,
    color: '#64748B',
  },
  recordChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  serviceTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
    textTransform: 'capitalize',
  },
  notesContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
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

