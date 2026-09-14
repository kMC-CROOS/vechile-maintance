import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export interface VehicleCategoryItem {
  id: string;
  value: string;
  title: string;
  subtitle?: string;
  image: ImageSourcePropType | string;
}

export const DEFAULT_VEHICLES: VehicleCategoryItem[] = [
  {
    id: 'car',
    value: 'Car',
    title: 'Car',
    subtitle: 'Sedan / SUV / EV',
    image: require('../../../assets/images/vehicles/car.png'),
  },
  {
    id: 'bike',
    value: 'Bike',
    title: 'Bike',
    subtitle: 'Motorcycle / Scooter',
    image: require('../../../assets/images/vehicles/bike.png'),
  },
  {
    id: 'three_wheeler',
    value: 'Three-Wheeler',
    title: 'Three-Wheeler',
    subtitle: 'Auto / Rickshaw',
    image: require('../../../assets/images/vehicles/three_wheeler.png'),
  },
  {
    id: 'van_suv',
    value: 'Van / SUV',
    title: 'Van / SUV',
    subtitle: 'Delivery / Minibus',
    image: require('../../../assets/images/vehicles/van.png'),
  },
  {
    id: 'truck',
    value: 'Truck',
    title: 'Truck',
    subtitle: 'Flatbed / Lorry',
    image: require('../../../assets/images/vehicles/truck.png'),
  },
];

export interface VehicleCategoryCardsAnimatedProps {
  /**
   * Currently selected category value (e.g. 'Car', 'Bike').
   */
  selectedCategory?: string;

  /**
   * Callback fired when a category card is selected.
   */
  onSelectCategory?: (category: VehicleCategoryItem) => void;

  /**
   * Optional custom categories list. Defaults to the 5 core vehicle types.
   */
  categories?: VehicleCategoryItem[];

  /**
   * Section title above the cards. Defaults to "Vehicle Type".
   */
  label?: string;

  /**
   * Optional container style overrides.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Production-ready Animated Vehicle Category Cards Component
 * Features:
 * - Staggered top-level reveal entry animation with smooth upward float & fade
 * - Fluid spring scale micro-animations upon card selection
 * - 100% Native Driver GPU acceleration (`useNativeDriver: true`)
 * - Rich illustrative vehicle imagery positioned prominently above category titles
 * - Luminous electric blue glow border and active badge indicator
 */
export const VehicleCategoryCardsAnimated: React.FC<VehicleCategoryCardsAnimatedProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = DEFAULT_VEHICLES,
  label = 'Vehicle Type',
  style,
}) => {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedCategory || (categories.length > 0 ? categories[0].value : 'Car')
  );

  const activeValue = selectedCategory !== undefined ? selectedCategory : internalSelected;

  // 1. Initialize independent Animated values for each card using useRef
  const cardAnimations = useRef(
    categories.map((item) => {
      const isInitiallySelected =
        (selectedCategory || 'Car').toLowerCase() === item.value.toLowerCase();
      return {
        // Entry animation drivers
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(40),
        // Interactive selection & tactile spring scale driver
        scale: new Animated.Value(isInitiallySelected ? 1.03 : 1.0),
        // Glow effect fade driver
        glowOpacity: new Animated.Value(isInitiallySelected ? 1 : 0),
      };
    })
  ).current;

  // 2. Cinematic Staggered Entry Animation on Mount
  useEffect(() => {
    const entrySequence = cardAnimations.map((anim, index) => {
      const isCardSelected =
        activeValue.toLowerCase() === categories[index].value.toLowerCase();

      return Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 540,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: isCardSelected ? 1.03 : 1.0,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]);
    });

    // Stagger arrival by 75ms for a gorgeous cascading reveal
    const animation = Animated.stagger(75, entrySequence);
    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  // 3. Interactive Micro-Animation on Selection
  const handleCardPress = (item: VehicleCategoryItem, tappedIndex: number) => {
    setInternalSelected(item.value);
    if (onSelectCategory) {
      onSelectCategory(item);
    }

    // Trigger organic spring scale and glow transitions for all cards
    categories.forEach((cat, index) => {
      const isThisCard = index === tappedIndex;
      const anim = cardAnimations[index];

      if (isThisCard) {
        // Active card: bounce spring scale up and fade in neon glow
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1.035,
            friction: 5,
            tension: 130,
            useNativeDriver: true,
          }),
          Animated.timing(anim.glowOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Non-active cards: smoothly settle back to base scale and fade out glow
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1.0,
            friction: 7,
            tension: 110,
            useNativeDriver: true,
          }),
          Animated.timing(anim.glowOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {categories.map((item, index) => {
          const isSelected =
            activeValue.toLowerCase() === item.value.toLowerCase() ||
            activeValue.toLowerCase() === item.id.toLowerCase();

          const anim = cardAnimations[index];
          const imageSource =
            typeof item.image === 'string' ? { uri: item.image } : item.image;

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.animatedCardContainer,
                {
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                },
              ]}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleCardPress(item, index)}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.title}, ${item.subtitle || ''}`}>
                
                {/* Active Luminous Glow Background Overlay */}
                <Animated.View
                  style={[
                    styles.activeGlowOverlay,
                    { opacity: anim.glowOpacity },
                  ]}
                  pointerEvents="none"
                />

                {/* Top-Right Checkmark Badge */}
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                    {isSelected ? '✓' : ''}
                  </Text>
                </View>

                {/* Prominent Vehicle Illustration Container */}
                <View style={styles.imageContainer}>
                  <Image
                    source={imageSource}
                    style={styles.vehicleImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Category Title & Subtitle Below the Image */}
                <View style={styles.labelContainer}>
                  <Text
                    style={[styles.title, isSelected && styles.titleSelected]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text
                      style={[styles.subtitle, isSelected && styles.subtitleSelected]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default VehicleCategoryCardsAnimated;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  scrollContent: {
    paddingRight: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  animatedCardContainer: {
    // Hardware accelerated GPU boundary
  },
  card: {
    width: 146,
    height: 154,
    backgroundColor: '#162032',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#243247',
    padding: 10,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    // Subtle drop shadow for non-selected cards
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  cardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#172554',
    borderWidth: 2,
    // Electric blue neon glow shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },
  activeGlowOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2E415E',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  badgeText: {
    color: 'transparent',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 12,
  },
  badgeTextSelected: {
    color: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    zIndex: 2,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    paddingTop: 4,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  titleSelected: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 10.5,
    color: '#64748B',
  },
  subtitleSelected: {
    color: '#93C5FD',
  },
});
