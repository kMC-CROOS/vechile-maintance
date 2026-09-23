import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export interface ScanDocumentCardProps {
  onScanPress: () => void;
  autoFilledCount?: number | null;
}

const ScanIcon = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M8 12h8M12 8v8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SparkleIcon = ({ color = '#2563EB', size = 14 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L13.7 8.3L20 10L13.7 11.7L12 18L10.3 11.7L4 10L10.3 8.3L12 2Z" fill={color} />
  </Svg>
);

export const ScanDocumentCard: React.FC<ScanDocumentCardProps> = ({
  onScanPress,
  autoFilledCount,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={onScanPress}
        accessibilityRole="button"
        accessibilityLabel="Scan Registration Certificate and AI Auto-Fill details">
        {/* Left Icon Badge */}
        <View style={styles.iconCircle}>
          <ScanIcon color="#FFFFFF" size={22} />
        </View>

        {/* Content Body */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Scan RC / Vehicle Book</Text>
            <View style={styles.badge}>
              <SparkleIcon color="#2563EB" size={11} />
              <Text style={styles.badgeText}>AI AUTO-FILL</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Scan your vehicle document and we'll fill all details automatically.
          </Text>
        </View>

        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      {/* Auto-fill Success Highlight Banner */}
      {autoFilledCount && autoFilledCount > 0 ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>
            ⚡ {autoFilledCount} fields filled automatically from your document scan. You can review and edit any field below.
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.4,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  successBanner: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    lineHeight: 16,
  },
});
