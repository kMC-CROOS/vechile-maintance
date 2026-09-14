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

export interface VehicleCategory {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  image: string | ImageSourcePropType;
}

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: '1',
    title: 'Two-Wheeler',
    subtitle: 'Bike / Scooter',
    value: 'bike',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    title: 'Car / SUV',
    subtitle: 'Sedan / SUV / Hatchback',
    value: 'car',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    title: 'Three-Wheeler',
    subtitle: 'Auto / Rickshaw',
    value: 'three-wheeler',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    title: 'Van / Light Commercial',
    subtitle: 'Van / Pickup / Minibus',
    value: 'van_suv',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    title: 'Heavy Vehicle',
    subtitle: 'Lorry / Bus / Truck',
    value: 'truck',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
  },
];

export interface VehicleTypeSelectorProps {
  /**
   * Main step heading text. Defaults to "Step 1: Basics & Specs".
   */
  stepTitle?: string;

  /**
   * Alias for stepTitle or label for backwards compatibility.
   */
  title?: string;

  /**
   * Field label text. Defaults to "Vehicle Type".
   */
  label?: string;

  /**
   * Currently selected category value or id (e.g., 'car').
   */
  selectedCategory?: string;

  /**
   * Callback fired when a category card is tapped.
   */
  onSelectCategory: (category: VehicleCategory) => void;

  /**
   * Optional custom category list (defaults to VEHICLE_CATEGORIES).
   */
  categories?: VehicleCategory[];

  /**
   * Layout presentation mode:
   * - 'horizontal': Horizontal ScrollView (as specified in UI requirements)
   * - 'grid': 2-column responsive layout (as seen in screenshot)
   * Defaults to 'horizontal'.
   */
  layout?: 'horizontal' | 'grid';

  /**
   * Container style overrides.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Production-ready React Native Vehicle Category Selector Component
 * Strictly designed for vehicle maintenance applications.
 *
 * Highlights:
 * - Deep navy dark theme (#0a122e)
 * - Initial load staggered fade-in & slide-up entry animation via React Native's `Animated` library
 * - 60fps Native Driver GPU acceleration (`useNativeDriver: true`)
 * - Illuminated active state with bright blue glowing border (#2b7fff)
 * - Supports both horizontal scroll and 2-column grid presentation
 */
export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  stepTitle = 'Step 1: Basics & Specs',
  title,
  label = 'Vehicle Type',
  selectedCategory,
  onSelectCategory,
  categories = VEHICLE_CATEGORIES,
  layout = 'horizontal',
  style,
}) => {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedCategory || (categories.length > 0 ? categories[0].value : 'car')
  );

  const activeValue = selectedCategory !== undefined ? selectedCategory : internalSelected;

  // 1. Initialize Animated values for each card using useRef
  const animatedValues = useRef(
    categories.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(32),
    }))
  ).current;

  // 2. Initial load entry animation triggered on mount via useEffect
  useEffect(() => {
    // Build parallel animations (fade-in & slide-up) for each card
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
      ])
    );

    // Stagger each card's arrival by 70ms for an ultra-smooth cascading effect
    const entryAnimation = Animated.stagger(70, cardAnimations);
    entryAnimation.start();

    return () => {
      entryAnimation.stop();
    };
  }, [animatedValues]);

  const handleSelect = (category: VehicleCategory) => {
    setInternalSelected(category.value);
    onSelectCategory(category);
  };

  const renderCard = (item: VehicleCategory, index: number) => {
    const isSelected = activeValue === item.value || activeValue === item.id;
    const anim = animatedValues[index] || {
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
    };
    const imageSource = typeof item.image === 'string' ? { uri: item.image } : item.image;
    const isGrid = layout === 'grid';

    return (
      <Animated.View
        key={item.id}
        style={[
          isGrid ? styles.gridCardWrapper : styles.horizontalCardWrapper,
          {
            opacity: anim.opacity,
            transform: [{ translateY: anim.translateY }],
          },
        ]}>
        <TouchableOpacity
          style={[styles.card, isGrid ? styles.cardGrid : styles.cardHorizontal, isSelected && styles.cardSelected]}
          activeOpacity={0.82}
          onPress={() => handleSelect(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          accessibilityLabel={`${item.title}, ${item.subtitle}`}>
          {/* Active selection glow overlay */}
          {isSelected && <View style={styles.selectedGlowOverlay} pointerEvents="none" />}

          {/* Circular Indicator Badge (Top Right) */}
          <View style={[styles.badge, isSelected && styles.badgeSelected]}>
            <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
              {isSelected ? '✓' : ''}
            </Text>
          </View>

          {/* Vehicle Photography Banner */}
          <View style={styles.imageWrapper}>
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          {/* Category Titles */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, isSelected && styles.titleSelected]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text
              style={[styles.subtitle, isSelected && styles.subtitleSelected]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item.subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Step Header */}
      <View style={styles.header}>
        {stepTitle || title ? <Text style={styles.stepTitle}>{title || stepTitle}</Text> : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>

      {/* Cards List: Horizontal ScrollView or 2-Column Grid */}
      {layout === 'horizontal' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {categories.map((category, index) => renderCard(category, index))}
        </ScrollView>
      ) : (
        <View style={styles.gridContainer}>
          {categories.map((category, index) => renderCard(category, index))}
        </View>
      )}
    </View>
  );
};

export default VehicleTypeSelector;

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
  /* Horizontal Layout */
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  horizontalCardWrapper: {
    marginHorizontal: 6,
  },
  cardHorizontal: {
    width: 235,
    height: 172,
  },
  /* Grid Layout (2 columns matching screenshot) */
  gridContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCardWrapper: {
    width: '48.5%',
    marginBottom: 14,
  },
  cardGrid: {
    width: '100%',
    height: 172,
  },
  /* Common Card Styling */
  card: {
    backgroundColor: '#141f38',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#23375c',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardSelected: {
    borderColor: '#2b7fff',
    backgroundColor: '#16284a',
    borderWidth: 2,
    shadowColor: '#2b7fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
    elevation: 8,
  },
  selectedGlowOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43, 127, 255, 0.08)',
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#263b63',
    backgroundColor: 'rgba(10, 18, 46, 0.72)',
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
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 13,
  },
  badgeTextSelected: {
    color: '#ffffff',
  },
  imageWrapper: {
    width: '100%',
    height: 106,
    backgroundColor: '#1b2a4a',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  titleSelected: {
    color: '#60a5fa',
  },
  subtitle: {
    fontSize: 12,
    color: '#8a99ad',
  },
  subtitleSelected: {
    color: '#d0daf0',
  },
});
