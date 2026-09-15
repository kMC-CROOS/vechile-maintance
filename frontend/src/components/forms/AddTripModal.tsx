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

interface AddTripModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: any) => void | Promise<void>;
  currentOdometer?: number;
}

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const AddTripModal: React.FC<AddTripModalProps> = ({
  visible,
  onClose,
  onSave,
  currentOdometer = 1500,
}) => {
  const [destination, setDestination] = useState('');
  const [startOdo, setStartOdo] = useState(currentOdometer.toString());
  const [endOdo, setEndOdo] = useState((currentOdometer + 120).toString());
  const [fuelUsed, setFuelUsed] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const distance = Math.max(0, (Number(endOdo) || 0) - (Number(startOdo) || 0));

  const handleSave = async (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!destination.trim()) {
      Alert.alert('Required', 'Please enter a Trip Name or Destination');
      return;
    }
    if (!startOdo || !endOdo || Number(endOdo) < Number(startOdo)) {
      Alert.alert('Invalid Odometer', 'End odometer must be greater than or equal to start odometer');
      return;
    }

    setLoading(true);
    const tripData = {
      destination: destination.trim(),
      startOdometer: Number(startOdo),
      endOdometer: Number(endOdo),
      distance,
      fuelUsed: fuelUsed ? Number(fuelUsed) : undefined,
      cost: cost ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (onSave) {
        await onSave(tripData);
      }
      Alert.alert('Success', `Trip to ${destination} logged (${distance} KM)!`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save trip');
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.title}>Log New Trip</Text>
              <Text style={styles.subtitle}>Track travel distance, fuel consumption, and tolls</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Destination */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trip Name / Destination *</Text>
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="e.g. Weekend Drive to Lonavala, Airport Drop"
              />
            </View>

            {/* Odometer Readings */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Odometer Readings & Distance</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>Start Odometer (KM)</Text>
                  <TextInput
                    style={styles.input}
                    value={startOdo}
                    onChangeText={setStartOdo}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8, marginBottom: 0 }]}>
                  <Text style={styles.label}>End Odometer (KM)</Text>
                  <TextInput
                    style={styles.input}
                    value={endOdo}
                    onChangeText={setEndOdo}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Calculated Distance Callout */}
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>Total Trip Distance: {distance} KM</Text>
              </View>
            </View>

            {/* Fuel & Expenses */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Fuel Used (Litres)</Text>
                <TextInput
                  style={styles.input}
                  value={fuelUsed}
                  onChangeText={setFuelUsed}
                  keyboardType="numeric"
                  placeholder="e.g. 8.5"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Trip Cost (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="numeric"
                  placeholder="e.g. 950"
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Route taken, toll charges, passengers..."
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
                {loading ? 'Saving Trip...' : 'Save Trip Log'}
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
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
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
