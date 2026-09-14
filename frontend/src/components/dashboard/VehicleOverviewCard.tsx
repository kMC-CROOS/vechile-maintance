import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface VehicleOverviewCardProps {
  vehicleName?: string;
  category?: string;
  modelDetails?: string;
  odometer?: number;
  onEditPress?: () => void;
}

const EditPencilIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56263 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const VehicleOverviewCard: React.FC<VehicleOverviewCardProps> = ({
  vehicleName = 'Croos',
  category = 'Bike',
  modelDetails = 'Honda Xc 700 • Cw123',
  odometer = 1500,
  onEditPress,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* SVG Blue Gradient Background */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1E40AF" />
            <Stop offset="50%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#3B82F6" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={18} fill="url(#grad)" />
      </Svg>

      <View style={styles.content}>
        {/* Top Badges & Edit Icon */}
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>🛵 {category}</Text>
            </View>
            <View style={styles.odometerBadge}>
              <Text style={styles.odometerText}>{odometer.toLocaleString()} KM</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={onEditPress}
            activeOpacity={0.75}
            accessibilityLabel="Edit Odometer or Vehicle">
            <EditPencilIcon />
          </TouchableOpacity>
        </View>

        {/* Vehicle Name & Model Specs */}
        <View style={styles.bottomInfo}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <Text style={styles.modelDetails}>{modelDetails}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 18,
    height: 148,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  content: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  odometerBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  odometerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    gap: 2,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modelDetails: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
