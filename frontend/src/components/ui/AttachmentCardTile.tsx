import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface AttachmentCardTileProps {
  title: string;
  subtitle: string;
  uri?: string | null;
  onPick: () => void;
  onRemove: () => void;
  iconType?: 'camera' | 'document';
}

const CameraIcon = ({ color = '#2563EB', size = 24 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

const DocIcon = ({ color = '#2563EB', size = 24 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const AttachmentCardTile: React.FC<AttachmentCardTileProps> = ({
  title,
  subtitle,
  uri,
  onPick,
  onRemove,
  iconType = 'camera',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title}</Text>

      {uri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewOverlay}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>✓ Attached</Text>
            </View>

            <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
              <Text style={styles.removeBtnText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadArea}
          activeOpacity={0.8}
          onPress={onPick}
          accessibilityRole="button"
          accessibilityLabel={`Upload ${title}`}>
          <View style={styles.iconCircle}>
            {iconType === 'camera' ? <CameraIcon color="#2563EB" size={24} /> : <DocIcon color="#2563EB" size={24} />}
          </View>
          <Text style={styles.uploadTitle}>+ Add {title}</Text>
          <Text style={styles.uploadSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  uploadArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  uploadSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },
  previewCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
