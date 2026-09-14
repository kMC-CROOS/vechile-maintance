import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DatePickerField } from '@/components/ui/DatePickerField';

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  currentOdometer?: number;
}

const SERVICE_TYPES = [
  'Engine Oil',
  'Oil Filter',
  'Air Filter',
  'Coolant',
  'Brake Pads',
  'General Service',
  'Spark Plug',
  'Battery Check',
  'Wheel Alignment',
  'Transmission Fluid',
  'Chain / Belt Lube',
  'Tire Rotation',
];

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  visible,
  onClose,
  onSave,
  currentOdometer = 1500,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [serviceDate, setServiceDate] = useState(today);
  const [odometer, setOdometer] = useState(currentOdometer.toString());
  const [workshopName, setWorkshopName] = useState('');
  const [mechanicName, setMechanicName] = useState('');
  const [mechanicPhone, setMechanicPhone] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueOdometer, setNextDueOdometer] = useState(
    (currentOdometer + 3000).toString()
  );
  const [selectedServices, setSelectedServices] = useState<string[]>(['Engine Oil', 'General Service']);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleService = (type: string) => {
    if (selectedServices.includes(type)) {
      setSelectedServices(selectedServices.filter((s) => s !== type));
    } else {
      setSelectedServices([...selectedServices, type]);
    }
  };

  const handleSave = () => {
    if (!odometer.trim()) {
      Alert.alert('Required', 'Please enter the service odometer reading');
      return;
    }
    if (!cost.trim()) {
      Alert.alert('Required', 'Please enter the total service cost');
      return;
    }

    setLoading(true);
    const record = {
      serviceDate,
      odometer: Number(odometer),
      workshopName,
      mechanicName,
      mechanicPhone,
      cost: Number(cost),
      nextDueOdometer: Number(nextDueOdometer) || undefined,
      services: selectedServices,
      notes,
    };

    setTimeout(() => {
      setLoading(false);
      if (onSave) onSave(record);
      Alert.alert('Success', 'Service record logged successfully!');
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
              <Text style={styles.title}>Add Service Record</Text>
              <Text style={styles.subtitle}>Log maintenance, parts, and oil changes</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Service Date & Odometer Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Service Date</Text>
                <DatePickerField value={serviceDate} onChangeText={setServiceDate} />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Odometer (KM) *</Text>
                <TextInput
                  style={styles.input}
                  value={odometer}
                  onChangeText={setOdometer}
                  keyboardType="numeric"
                  placeholder="e.g. 1500"
                />
              </View>
            </View>

            {/* Total Cost & Next Due Odometer */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Total Cost (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="numeric"
                  placeholder="e.g. 1850"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Next Due (KM)</Text>
                <TextInput
                  style={styles.input}
                  value={nextDueOdometer}
                  onChangeText={setNextDueOdometer}
                  keyboardType="numeric"
                  placeholder="e.g. 4500"
                />
              </View>
            </View>

            {/* Workshop & Mechanic Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Garage & Mechanic Details</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Workshop / Garage Name</Text>
                <TextInput
                  style={styles.input}
                  value={workshopName}
                  onChangeText={setWorkshopName}
                  placeholder="e.g. Authorized Service Center"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>Mechanic Name</Text>
                  <TextInput
                    style={styles.input}
                    value={mechanicName}
                    onChangeText={setMechanicName}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>Mechanic Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={mechanicPhone}
                    onChangeText={setMechanicPhone}
                    keyboardType="phone-pad"
                    placeholder="e.g. 9876543210"
                  />
                </View>
              </View>
            </View>

            {/* Service Items Grid */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Select Services Performed</Text>
              <View style={styles.grid}>
                {SERVICE_TYPES.map((type) => {
                  const selected = selectedServices.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.servicePill, selected && styles.servicePillActive]}
                      onPress={() => toggleService(type)}
                      activeOpacity={0.75}>
                      <Text style={[styles.serviceText, selected && styles.serviceTextActive]}>
                        {selected ? '✓ ' : '+ '}
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Parts replaced, recommendations, oil grade..."
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
                {loading ? 'Saving Record...' : 'Save Service Record'}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  servicePillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  serviceTextActive: {
    color: '#1D4ED8',
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
