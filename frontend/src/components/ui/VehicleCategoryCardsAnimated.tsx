import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export interface VehicleCategoryItem {
  id: string;
  value: string;
  title: string;
  subtitle?: string;
  image: ImageSourcePropType | string;
  accentColor?: string;
}

export interface VehicleCategoryCardsAnimatedProps {
  selectedCategory?: string;
  onSelectCategory?: (category: VehicleCategoryItem) => void;
  categories?: VehicleCategoryItem[];
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

const CARD_WIDTH = 158;
const CARD_HEIGHT = 184;
const CARD_GAP = 12;

/* -------------------------------------------------------------------------- */
/*                                DEFAULT DATA                                */
/* -------------------------------------------------------------------------- */

export const DEFAULT_VEHICLES: VehicleCategoryItem[] = [
  {
    id: 'car',
    value: 'Car',
    title: 'CAR',
    subtitle: 'Sedan / SUV / EV',
    image: require('../../../assets/images/vehicles/car-hero.png'),
    accentColor: '#3B82F6',
  },
  {
    id: 'bike',
    value: 'Bike',
    title: 'BIKE',
    subtitle: 'Motorcycle / Scooter',
    image: require('../../../assets/images/vehicles/bike-hero.png'),
    accentColor: '#10B981',
  },
  {
    id: 'three_wheeler',
    value: 'Three-Wheeler',
    title: 'THREE-WHEELER',
    subtitle: 'Auto / Rickshaw',
    image: require('../../../assets/images/vehicles/three_wheeler-hero.png'),
    accentColor: '#F59E0B',
  },
  {
    id: 'van_suv',
    value: 'Van / SUV',
    title: 'VAN / SUV',
    subtitle: 'Delivery / Minibus',
    image: require('../../../assets/images/vehicles/van-hero.png'),
    accentColor: '#8B5CF6',
  },
  {
    id: 'bus',
    value: 'Bus',
    title: 'BUS',
    subtitle: 'Coach / School Bus',
    image: require('../../../assets/images/vehicles/bus-hero.png'),
    accentColor: '#EF4444',
  },
  {
    id: 'truck',
    value: 'Truck',
    title: 'TRUCK',
    subtitle: 'Flatbed / Lorry',
    image: require('../../../assets/images/vehicles/truck.png'),
    accentColor: '#06B6D4',
  },
  {
    id: 'heavy_duty',
    value: 'Heavy Duty',
    title: 'HEAVY DUTY',
    subtitle: 'Tipper / Trailer',
    image: require('../../../assets/images/vehicles/heavy_duty.png'),
    accentColor: '#F97316',
  },
  {
    id: 'tractor',
    value: 'Tractor',
    title: 'TRACTOR',
    subtitle: 'Agriculture / Farm',
    image: require('../../../assets/images/vehicles/tractor.png'),
    accentColor: '#84CC16',
  },
];

/* -------------------------------------------------------------------------- */
/*                                    ICONS                                   */
/* -------------------------------------------------------------------------- */

const CheckIcon = ({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SparkIcon = ({ size = 14 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L13.7 8.3L20 10L13.7 11.7L12 18L10.3 11.7L4 10L10.3 8.3L12 2Z" fill="#2563EB" />
    <Circle cx="18.5" cy="5.5" r="1.5" fill="#60A5FA" />
  </Svg>
);

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export const VehicleCategoryCardsAnimated: React.FC<VehicleCategoryCardsAnimatedProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = DEFAULT_VEHICLES,
  label = '1. Vehicle Category',
  style,
}) => {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedCategory || categories[0]?.value || 'Bike'
  );

  const activeValue = selectedCategory !== undefined ? selectedCategory : internalSelected;

  const animationValues = useRef(
    categories.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
      selectedScale: new Animated.Value(1),
      pressScale: new Animated.Value(1),
      glowOpacity: new Animated.Value(0),
      imageTranslateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = animationValues.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * 40,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 450,
          delay: index * 40,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();
  }, []);

  useEffect(() => {
    categories.forEach((item, index) => {
      const isSelected =
        activeValue.toLowerCase() === item.value.toLowerCase() ||
        activeValue.toLowerCase() === item.id.toLowerCase();

      const anim = animationValues[index];

      Animated.parallel([
        Animated.spring(anim.selectedScale, {
          toValue: isSelected ? 1.03 : 1.0,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(anim.glowOpacity, {
          toValue: isSelected ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(anim.imageTranslateY, {
          toValue: isSelected ? -4 : 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeValue]);

  const handlePress = (item: VehicleCategoryItem) => {
    if (selectedCategory === undefined) {
      setInternalSelected(item.value);
    }
    onSelectCategory?.(item);
  };

  const handlePressIn = (index: number) => {
    Animated.spring(animationValues[index].pressScale, {
      toValue: 0.96,
      friction: 8,
      tension: 220,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(animationValues[index].pressScale, {
      toValue: 1.0,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionLabel}>{label}</Text>
          <Text style={styles.sectionDescription}>Choose category for instant spec tuning</Text>
        </View>

        <View style={styles.premiumBadge}>
          <SparkIcon size={12} />
          <Text style={styles.premiumBadgeText}>3D STUDIO</Text>
        </View>
      </View>

      {/* Horizontal Cards Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {categories.map((item, index) => {
          const isSelected =
            activeValue.toLowerCase() === item.value.toLowerCase() ||
            activeValue.toLowerCase() === item.id.toLowerCase();

          const anim = animationValues[index];
          const source = typeof item.image === 'string' ? { uri: item.image } : item.image;

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardAnimationContainer,
                {
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: anim.selectedScale },
                    { scale: anim.pressScale },
                  ],
                },
              ]}>
              <Pressable
                onPress={() => handlePress(item)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.title}>
                <View style={[styles.card, isSelected && styles.cardSelected]}>
                  {/* Top Checkmark Badge */}
                  <View style={[styles.selectionBadge, isSelected && styles.selectionBadgeActive]}>
                    {isSelected ? (
                      <CheckIcon size={11} color="#FFFFFF" />
                    ) : (
                      <View style={styles.emptyBadgeDot} />
                    )}
                  </View>

                  {/* Vehicle 3D Studio Stage (Midnight Dark Box for Crisp Contrast) */}
                  <View style={[styles.imageStage, isSelected && styles.imageStageSelected]}>
                    {/* Atmospheric Lighting Halos */}
                    <View
                      style={[
                        styles.imageHaloLarge,
                        isSelected && { backgroundColor: 'rgba(56, 189, 248, 0.28)' },
                      ]}
                    />
                    <View
                      style={[
                        styles.imageHaloSmall,
                        isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                      ]}
                    />

                    {/* Animated Vehicle Image */}
                    <Animated.View
                      style={[
                        styles.vehicleImageWrapper,
                        { transform: [{ translateY: anim.imageTranslateY }] },
                      ]}>
                      <Image source={source} style={styles.vehicleImage} resizeMode="contain" />
                    </Animated.View>

                    {/* Studio Floor Shadow */}
                    <View
                      style={[
                        styles.vehicleFloorShadow,
                        isSelected && styles.vehicleFloorShadowSelected,
                      ]}
                    />
                  </View>

                  {/* Title & Subtitle */}
                  <View style={styles.content}>
                    <View style={styles.categoryRow}>
                      <Text
                        numberOfLines={1}
                        style={[styles.title, isSelected && styles.titleSelected]}>
                        {item.title}
                      </Text>

                      {isSelected && (
                        <View style={styles.activeDot}>
                          <View style={styles.activeDotInner} />
                        </View>
                      )}
                    </View>

                    {item.subtitle ? (
                      <Text
                        numberOfLines={1}
                        style={[styles.subtitle, isSelected && styles.subtitleSelected]}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default VehicleCategoryCardsAnimated;

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 4,
  },

  header: {
    paddingHorizontal: 2,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  sectionDescription: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },

  premiumBadge: {
    height: 24,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  premiumBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },

  scrollContent: {
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 10,
    gap: CARD_GAP,
  },

  cardAnimationContainer: {
    width: CARD_WIDTH,
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  cardSelected: {
    backgroundColor: '#F0F7FF',
    borderColor: '#2563EB',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  selectionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    zIndex: 20,
  },

  selectionBadgeActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },

  emptyBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#94A3B8',
  },

  /* 3D Studio Stage for Clean Premium Light Showcase */
  imageStage: {
    height: 112,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  imageStageSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  imageHaloLarge: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },

  imageHaloSmall: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },

  vehicleImageWrapper: {
    width: '95%',
    height: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },

  vehicleImage: {
    width: '100%',
    height: '100%',
  },

  vehicleFloorShadow: {
    position: 'absolute',
    width: 88,
    height: 10,
    borderRadius: 44,
    bottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    transform: [{ scaleY: 0.5 }],
  },

  vehicleFloorShadowSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },

  content: {
    marginTop: 10,
    paddingHorizontal: 2,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    flex: 1,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  titleSelected: {
    color: '#2563EB',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  subtitleSelected: {
    color: '#1D4ED8',
  },

  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563EB',
  },
});