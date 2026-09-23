import { DashboardIcon } from './DashboardIcon';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AnimatedCountText } from '@/components/ui/AnimatedCountText';
import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';
import { getVehicleImageSource } from '@/utils/dashboardFormatters';

interface VehicleOverviewCardProps {
  vehicleName?: string;
  category?: string;
  modelDetails?: string;
  registrationNumber?: string;
  odometer?: number;
  photoUrl?: string | null;
  fuelType?: string;
  onEditPress?: () => void;
}

const EditPencilIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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

// Honda / Generic Car SVG Logo Badge
const VehicleLogoBadge = ({ brand }: { brand?: string }) => (
  <View style={styles.logoBadgeContainer}>
    <Text style={styles.logoBadgeText}>
      {brand?.toUpperCase().charAt(0) || 'V'}
    </Text>
  </View>
);

export const VehicleOverviewCard: React.FC<VehicleOverviewCardProps> = ({
  vehicleName = 'honda',
  category = 'Car',
  modelDetails = 'honda v2020 - 4D30KD',
  registrationNumber,
  odometer = 1500,
  photoUrl,
  fuelType = 'Not set',
  onEditPress,
}) => {
  const [cardWidth, setCardWidth] = useState(0);
  const wide = cardWidth >= 600;
  const heroHeight = wide ? 320 : 240;
  const imageSource = getVehicleImageSource(category, photoUrl);

  const fullModelText = modelDetails || (registrationNumber ? `${category} • ${registrationNumber}` : category);

  return (
    <View onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)} style={[styles.cardContainer, { height: heroHeight }]}>
      {/* Premium Dark Blue Automotive Gradient */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 980 320" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#081A3A" />
              <Stop offset="45%" stopColor="#082B62" />
              <Stop offset="100%" stopColor="#1769FF" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={20} fill="url(#heroGrad)" />
          <Path d="M180 290L470 0H620L330 290Z" fill="#086AFF" opacity={0.18} />
          <Path d="M0 260L980 150V320H0Z" fill="#128AFF" opacity={0.14} />
        </Svg>
      </View>

      <View style={styles.content}>
        {/* Top Badges & Edit Button */}
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            <VehicleLogoBadge brand={vehicleName} />

            <View style={styles.odometerBadge}>
              <AnimatedCountText
                style={styles.odometerText}
                numberOfLines={1}
                value={odometer}
                suffix=" KM"
              />
            </View>
          </View>

          <AnimatedPressableCard
            style={styles.editButton}
            onPress={onEditPress}
            scaleTo={0.9}
            accessibilityLabel="Edit vehicle or odometer">
            <EditPencilIcon />
          </AnimatedPressableCard>
        </View>

        {/* Main Info */}
        <View style={styles.infoArea}>
          <Text style={[styles.vehicleName, wide && { fontSize: 34 }]} numberOfLines={1}>
            {vehicleName.toLowerCase()}
          </Text>
          <Text style={styles.modelDetails} numberOfLines={1}>
            {fullModelText.toLowerCase()}
          </Text>
          <View style={styles.detailRow}>
            <DashboardIcon name="gauge" size={16} color="#FFFFFF" />
            <Text style={styles.detailText} numberOfLines={1}>{odometer.toLocaleString()} KM</Text>
          </View>
          <View style={styles.detailRow}>
            <DashboardIcon name="fuel" size={16} color="#FFFFFF" />
            <Text style={styles.detailText} numberOfLines={1}>{fuelType}</Text>
          </View>
        </View>
      </View>

      {wide ? <Text style={styles.heroMotto}>Ride Better.{"\n"}Go Further.</Text> : null}
      
      {/* Animated Vehicle Driving-in Image Overlay */}
      <Animated.View
        key={`${vehicleName}-${category}-${photoUrl}`}
        entering={SlideInRight.duration(700).springify().damping(14)}
        style={[styles.imageWrapper, wide && { width: '49%', right: '15%', height: '84%' }]}
        pointerEvents="none">
        <Image
          source={imageSource}
          style={styles.vehicleImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  detailText: { color: '#FFFFFF', fontSize: 12, flexShrink: 1, fontWeight: '600' },
  heroMotto: { position: 'absolute', right: 20, bottom: 45, color: '#BBDDFF', fontSize: 18, fontStyle: 'italic', width: '14%', lineHeight: 26 },
  cardContainer: {
    borderRadius: 20,
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#081A3A',
    minHeight: 240,
    borderWidth: 1,
    borderColor: '#54BAFF',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#082B62',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  logoBadgeContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  odometerBadge: {
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: 'rgba(23, 105, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  odometerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoArea: {
    gap: 3,
    width: '43%',
    minWidth: 0,
  },
  vehicleName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  modelDetails: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  imageWrapper: {
    position: 'absolute',
    right: 8,
    bottom: 12,
    width: '52%',
    height: '70%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
});
