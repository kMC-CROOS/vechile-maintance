import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
  label: string;
  sublabel?: string;
  image: string | ImageSourcePropType;
}

export const DEFAULT_VEHICLE_CATEGORIES: VehicleCategoryItem[] = [
  {
    id: 'car',
    label: 'CAR',
    sublabel: 'Audi e-tron / Sedan',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bike',
    label: 'BIKE',
    sublabel: 'Motorcycle / Scooter',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'three_wheeler',
    label: 'THREE-WHEELER',
    sublabel: 'Auto / Rickshaw',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'van_suv',
    label: 'VAN / SUV',
    sublabel: 'Van / Commercial / SUV',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'truck',
    label: 'TRUCK',
    sublabel: 'Heavy Vehicle / Lorry',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
  },
];

export interface VehicleHorizontalSelectorProps {
  /**
   * Main heading text. Defaults to "Step 1: Basics & Specs".
   */
  stepTitle?: string;

  /**
   * Field label text. Defaults to "Vehicle Type".
   */
  label?: string;

  /**
   * ID of the currently selected vehicle category (e.g. 'car').
   */
  selectedId?: string;

  /**
   * Callback triggered when a category card is tapped.
   */
  onSelectCategory?: (category: VehicleCategoryItem) => void;

  /**
   * List of vehicle category items. Defaults to the 5 standard types.
   */
  categories?: VehicleCategoryItem[];

  /**
   * Optional container style overrides.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Production-Ready React Native Horizontal Vehicle Selector Component
 * Features:
 * - Deep navy dark theme (#0a122e)
 * - Initial load staggered fade-in & slide-up entry animation via React Native's `Animated` library
 * - 60fps Native Driver GPU acceleration (`useNativeDriver: true`)
 * - Illuminated active state with bright blue glow and checkmark
 */
export const VehicleHorizontalSelector: React.FC<VehicleHorizontalSelectorProps> = ({
  stepTitle = 'Step 1: Basics & Specs',
  label = 'Vehicle Type',
  selectedId,
  onSelectCategory,
  categories = DEFAULT_VEHICLE_CATEGORIES,
  style,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(
    selectedId || (categories.length > 0 ? categories[0].id : 'car')
  );

  const selectedValue = selectedId !== undefined ? selectedId : activeCategory;

  // 1. Initialize Animated values for each card using useRef
  const animatedValues = useRef(
    categories.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
      scale: new Animated.Value(0.94),
    }))
  ).current;

  // 2. Initial load entry animation triggered in useEffect
  useEffect(() => {
    // Build staggered animations for all 5 cards
    const cardAnimations = animatedValues.map((anim) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // Stagger each card arrival by 70ms for a sophisticated cascading motion
    const animationSequence = Animated.stagger(70, cardAnimations);
    animationSequence.start();

    return () => {
      animationSequence.stop();
    };
  }, [animatedValues]);

  const handleCardPress = (category: VehicleCategoryItem) => {
    setActiveCategory(category.id);
    if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>{stepTitle}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* Horizontal Scroll View */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {categories.map((category, index) => {
          const isSelected = selectedValue === category.id;
          const anim = animatedValues[index] || {
            opacity: new Animated.Value(1),
            translateY: new Animated.Value(0),
            scale: new Animated.Value(1),
          };

          const imageSource =
            typeof category.image === 'string' ? { uri: category.image } : category.image;

          return (
            <Animated.View
              key={category.id}
              style={[
                styles.animatedCardWrapper,
                {
                  opacity: anim.opacity,
                  transform: [
                    { translateY: anim.translateY },
                    { scale: anim.scale },
                  ],
                },
              ]}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => handleCardPress(category)}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={category.label}>
                {/* Active Selection Checkmark Badge */}
                <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                  <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                    {isSelected ? '✓' : ''}
                  </Text>
                </View>

                {/* Subtle Inner Highlight Overlay for Selected State */}
                {isSelected && <View style={styles.activeGlowOverlay} pointerEvents="none" />}

                {/* Vehicle Image Container */}
                <View style={styles.imageContainer}>
                  <Image
                    source={imageSource}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>

                {/* Category Label at bottom */}
                <View style={styles.labelWrapper}>
                  <Text
                    style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}
                    numberOfLines={1}>
                    {category.label}
                  </Text>
                  {category.sublabel ? (
                    <Text style={styles.cardSublabel} numberOfLines={1}>
                      {category.sublabel}
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

export default VehicleHorizontalSelector;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#0a122e',
    paddingVertical: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8a99ad',
    letterSpacing: 0.1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: 'center',
  },
  animatedCardWrapper: {
    marginHorizontal: 5,
  },
  card: {
    width: 168,
    height: 172,
    backgroundColor: '#162032',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#233047',
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    // Subtle shadow for dark theme
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  cardSelected: {
    borderColor: '#2b7fff',
    borderWidth: 2,
    backgroundColor: '#152445',
    // Bright blue glowing border shadow
    shadowColor: '#2b7fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },
  activeGlowOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43, 127, 255, 0.08)',
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#233047',
    backgroundColor: 'rgba(10, 18, 46, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeSelected: {
    backgroundColor: '#2b7fff',
    borderColor: '#2b7fff',
  },
  badgeText: {
    color: 'transparent',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 12,
  },
  badgeTextSelected: {
    color: '#ffffff',
  },
  imageContainer: {
    width: '100%',
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    zIndex: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  labelWrapper: {
    zIndex: 2,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9eb1cb',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardTitleSelected: {
    color: '#ffffff',
  },
  cardSublabel: {
    fontSize: 10,
    color: '#657795',
    marginTop: 2,
  },
});
