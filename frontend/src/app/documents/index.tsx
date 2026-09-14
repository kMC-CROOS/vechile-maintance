import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import { useVehicle } from '@/context/VehicleContext';
import { apiFetch } from '@/services/api';

export default function DocumentsScreen() {
  const router = useRouter();
  const { activeVehicle, reloadVehicles } = useVehicle();

  const [activeTab, setActiveTab] = useState<'tax' | 'insurance' | 'warranty'>('tax');
  const [loading, setLoading] = useState(false);

  // Form states
  const [taxValidUntil, setTaxValidUntil] = useState(activeVehicle?.tax_record?.valid_until || '');
  const [taxAmountPaid, setTaxAmountPaid] = useState(
    activeVehicle?.tax_record?.amount_paid ? String(activeVehicle.tax_record.amount_paid) : ''
  );

  const [insuranceProvider, setInsuranceProvider] = useState(activeVehicle?.insurance?.provider || '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    activeVehicle?.insurance?.policy_number || ''
  );
  const [insuranceStartDate, setInsuranceStartDate] = useState(
    activeVehicle?.insurance?.start_date || ''
  );
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(
    activeVehicle?.insurance?.expiry_date || ''
  );

  const [warrantyStartDate, setWarrantyStartDate] = useState(activeVehicle?.warranty?.start_date || '');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState(
    activeVehicle?.warranty?.expiry_date || ''
  );

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSaveTax = async () => {
    if (!activeVehicle) return;
    if (!taxValidUntil) {
      Alert.alert('Validation Error', 'Please enter valid until date');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('valid_until', taxValidUntil);
      formData.append('amount_paid', taxAmountPaid || '0');

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'tax.jpg';
        formData.append('document', {
          uri: selectedImage,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      await apiFetch(`/vehicles/${activeVehicle.id}/tax`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      await reloadVehicles(activeVehicle.id);
      Alert.alert('Success', 'Revenue Licence / Tax record updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update tax record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInsurance = async () => {
    if (!activeVehicle) return;
    if (!insuranceExpiryDate) {
      Alert.alert('Validation Error', 'Please enter insurance expiry date');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (insuranceProvider) formData.append('provider', insuranceProvider);
      if (insurancePolicyNumber) formData.append('policy_number', insurancePolicyNumber);
      if (insuranceStartDate) formData.append('start_date', insuranceStartDate);
      formData.append('expiry_date', insuranceExpiryDate);

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'insurance.jpg';
        formData.append('document', {
          uri: selectedImage,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      await apiFetch(`/vehicles/${activeVehicle.id}/insurance`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      await reloadVehicles(activeVehicle.id);
      Alert.alert('Success', 'Insurance policy record updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update insurance record');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWarranty = async () => {
    if (!activeVehicle) return;
    if (!warrantyExpiryDate) {
      Alert.alert('Validation Error', 'Please enter warranty expiry date');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (warrantyStartDate) formData.append('start_date', warrantyStartDate);
      formData.append('expiry_date', warrantyExpiryDate);

      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'warranty.jpg';
        formData.append('document', {
          uri: selectedImage,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      await apiFetch(`/vehicles/${activeVehicle.id}/warranty`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });

      await reloadVehicles(activeVehicle.id);
      Alert.alert('Success', 'Warranty record updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update warranty record');
    } finally {
      setLoading(false);
    }
  };

  // Helper status calculation
  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'info';
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'due_soon';
    return 'valid';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backTouch} activeOpacity={0.7} onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Documents</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Sub-tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tax' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('tax');
            setSelectedImage(null);
          }}>
          <Text style={[styles.tabText, activeTab === 'tax' && styles.tabTextActive]}>
            Tax / Licence
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'insurance' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('insurance');
            setSelectedImage(null);
          }}>
          <Text style={[styles.tabText, activeTab === 'insurance' && styles.tabTextActive]}>
            Insurance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'warranty' && styles.tabActive]}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('warranty');
            setSelectedImage(null);
          }}>
          <Text style={[styles.tabText, activeTab === 'warranty' && styles.tabTextActive]}>
            Warranty
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {activeTab === 'tax' && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: Spacing.p8 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>Revenue Licence / Tax</Text>
                <Text style={styles.cardSub} numberOfLines={1}>Annual vehicle tax record</Text>
              </View>
              <Badge status={getDocumentStatus(activeVehicle?.tax_record?.valid_until)} />
            </View>

            <View style={styles.divider} />

            <Input
              label="Valid Until (YYYY-MM-DD)"
              placeholder="2027-04-30"
              value={taxValidUntil}
              onChangeText={setTaxValidUntil}
              isMono
            />

            <Input
              label="Amount Paid (LKR)"
              placeholder="e.g. 4500"
              value={taxAmountPaid}
              onChangeText={setTaxAmountPaid}
              keyboardType="numeric"
              isMono
            />

            {/* Document Photo Upload */}
            <Text style={styles.label}>Document Photo</Text>
            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : activeVehicle?.tax_record?.document_path ? (
                <Image source={{ uri: activeVehicle.tax_record.document_path }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={{ fontSize: 24 }}>📄</Text>
                  <Text style={styles.uploadText}>Tap to select or change document photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Button title="Save Tax Record" onPress={handleSaveTax} loading={loading} style={{ marginTop: Spacing.p16 }} />
          </Card>
        )}

        {activeTab === 'insurance' && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: Spacing.p8 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>Insurance Policy</Text>
                <Text style={styles.cardSub} numberOfLines={1}>Comprehensive / 3rd Party Policy</Text>
              </View>
              <Badge status={getDocumentStatus(activeVehicle?.insurance?.expiry_date)} />
            </View>

            <View style={styles.divider} />

            <Input
              label="Insurance Provider Name"
              placeholder="e.g. Ceylinco, Allianz"
              value={insuranceProvider}
              onChangeText={setInsuranceProvider}
            />

            <Input
              label="Policy Number"
              placeholder="e.g. POL-123456"
              value={insurancePolicyNumber}
              onChangeText={setInsurancePolicyNumber}
            />

            <Input
              label="Start Date (YYYY-MM-DD)"
              placeholder="2026-01-01"
              value={insuranceStartDate}
              onChangeText={setInsuranceStartDate}
              isMono
            />

            <Input
              label="Expiry Date (YYYY-MM-DD)"
              placeholder="2027-01-01"
              value={insuranceExpiryDate}
              onChangeText={setInsuranceExpiryDate}
              isMono
            />

            <Text style={styles.label}>Document Photo</Text>
            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : activeVehicle?.insurance?.document_path ? (
                <Image source={{ uri: activeVehicle.insurance.document_path }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={{ fontSize: 24 }}>📄</Text>
                  <Text style={styles.uploadText}>Tap to select or change policy document photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Button title="Save Insurance Record" onPress={handleSaveInsurance} loading={loading} style={{ marginTop: Spacing.p16 }} />
          </Card>
        )}

        {activeTab === 'warranty' && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: Spacing.p8 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>Vehicle Warranty</Text>
                <Text style={styles.cardSub} numberOfLines={1}>Agent or Manufacturer Warranty</Text>
              </View>
              <Badge status={getDocumentStatus(activeVehicle?.warranty?.expiry_date)} />
            </View>

            <View style={styles.divider} />

            <Input
              label="Start Date (YYYY-MM-DD)"
              placeholder="2024-01-01"
              value={warrantyStartDate}
              onChangeText={setWarrantyStartDate}
              isMono
            />

            <Input
              label="Expiry Date (YYYY-MM-DD)"
              placeholder="2027-01-01"
              value={warrantyExpiryDate}
              onChangeText={setWarrantyExpiryDate}
              isMono
            />

            <Text style={styles.label}>Document Photo</Text>
            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : activeVehicle?.warranty?.document_path ? (
                <Image source={{ uri: activeVehicle.warranty.document_path }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={{ fontSize: 24 }}>📄</Text>
                  <Text style={styles.uploadText}>Tap to select or change warranty card photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Button title="Save Warranty Record" onPress={handleSaveWarranty} loading={loading} style={{ marginTop: Spacing.p16 }} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 50,
    paddingBottom: Spacing.p16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backTouch: {
    minHeight: MinTouchTarget,
    justifyContent: 'center',
  },
  backLink: {
    color: Colors.primaryBlue,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primaryBlue,
  },
  tabText: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primaryBlue,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  card: {
    padding: Spacing.p20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSub: {
    fontSize: FontSizes.xs,
    color: Colors.textDim,
    marginTop: Spacing.p4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.p16,
  },
  label: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  uploadBox: {
    height: 140,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radii.medium,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.p16,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    padding: Spacing.p16,
  },
  uploadText: {
    color: Colors.textDim,
    fontSize: FontSizes.xs,
    marginTop: Spacing.p8,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
