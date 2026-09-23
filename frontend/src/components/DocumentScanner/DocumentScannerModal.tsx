import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { performDocumentOCR } from '../../services/ocrService';
import { ExtractionResult } from '../../types/registrationDocument.types';

export interface DocumentScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onExtractionComplete: (result: ExtractionResult) => void;
}

// Icons
const CameraIcon = ({ color = '#2563EB', size = 28 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

const GalleryIcon = ({ color = '#2563EB', size = 28 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SparklesIcon = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L13.7 8.3L20 10L13.7 11.7L12 18L10.3 11.7L4 10L10.3 8.3L12 2Z" fill={color} />
  </Svg>
);

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  visible,
  onClose,
  onExtractionComplete,
}) => {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    requestId.current++;
    busy.current = false;
    setCapturedUri(null);
    setLoadingStage(null);
    setError(null);
    return () => { requestId.current++; };
  }, [visible]);

  const handlePickFromGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { setError('Photo library permission is required.'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setError(null);
        setCapturedUri(result.assets[0].uri);
      }
    } catch (err: any) {
      setError('Unable to open the photo picker. Please try again.');
    }
  };

  const handleLaunchCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to scan document.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setError(null);
        setCapturedUri(result.assets[0].uri);
      }
    } catch (err: any) {
      setError('Unable to open the photo picker. Please try again.');
    }
  };

  const handleProcessDocument = async () => {
    if (!capturedUri || busy.current) return;
    busy.current = true;
    const id = ++requestId.current;
    setError(null);
    setLoadingStage('Reading document...');
    try {
      const result = await performDocumentOCR({ imageUri: capturedUri,
        onProgress: (message) => { if (id === requestId.current) setLoadingStage(message); },
      });
      if (id !== requestId.current) return;
      if (!Object.values(result.fields).some((field) => field?.value)) {
        setError('No readable registration fields found. Use a clear, full-page photo with English labels, or enter the details manually.');
        return;
      }
      onExtractionComplete(result);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'Unable to read this document. Please try another photo.');
    } finally {
      if (id === requestId.current) { busy.current = false; setLoadingStage(null); }
    }
  };

  const handleReset = () => {
    setCapturedUri(null);
    setLoadingStage(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { requestId.current++; onClose(); }}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <SparklesIcon color="#2563EB" size={20} />
              <Text style={styles.modalTitle}>Scan Registration Document</Text>
            </View>
            <TouchableOpacity onPress={() => { requestId.current++; onClose(); }} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text accessibilityRole="alert" style={{ color: '#B91C1C', marginBottom: 12 }}>{error}</Text> : null}
          {/* Loading Stage Indicator */}
          {loadingStage ? (
            <View style={styles.loadingContainer}>
              <SparklesIcon color="#2563EB" size={36} />
              <Text style={styles.loadingStageTitle}>{loadingStage}</Text>
              <Text style={styles.loadingSubtext}>Extracting Sri Lanka CR Book registration data...</Text>
            </View>
          ) : capturedUri ? (
            /* Document Edge Detection & Contrast Review Stage */
            <View style={styles.previewContainer}>
              <Text style={styles.stageHeadline}>Check that the full document is readable</Text>

              <View style={styles.imageBox}>
                <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />

              </View>
              <Text style={styles.optionsSubtext}>Keep all text in focus. Missing or unclear fields can be entered during review.</Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleReset}>
                  <Text style={styles.retakeBtnText}>[Retake]</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.useScanBtn} onPress={handleProcessDocument}>
                  <Text style={styles.useScanBtnText}>[Use Scan & Process]</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Option Selection Stage */
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsSubtext}>
                Select an option to capture your Sri Lanka Motor Vehicle Certificate of Registration (CR Book / RC):
              </Text>

              <TouchableOpacity style={styles.optionCard} activeOpacity={0.88} onPress={handleLaunchCamera}>
                <View style={styles.iconCircle}>
                  <CameraIcon color="#2563EB" size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Scan with Camera</Text>
                  <Text style={styles.optionDesc}>Capture a clear photo of the full document</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} activeOpacity={0.88} onPress={handlePickFromGallery}>
                <View style={styles.iconCircle}>
                  <GalleryIcon color="#2563EB" size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionDesc}>Upload existing document photo from media library</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    minHeight: 460,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },

  optionsContainer: {
    gap: 14,
    paddingVertical: 10,
  },
  optionsSubtext: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  optionDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  previewContainer: {
    alignItems: 'center',
  },
  stageHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 10,
  },
  imageBox: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#38BDF8',
    borderWidth: 3,
  },
  topLeft: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 },

  scanLineOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scanLineBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },

  enhanceRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 14,
  },
  enhancePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  enhancePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  enhanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  enhanceTextActive: {
    color: '#2563EB',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  useScanBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  useScanBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingStageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  loadingSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
});
