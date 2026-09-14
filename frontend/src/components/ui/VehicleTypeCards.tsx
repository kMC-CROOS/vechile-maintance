import React, { useState } from 'react';
import {
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
  image: ImageSourcePropType | string;
}

// 5 core vehicle categories with clear vehicle illustrations
export const VEHICLE_TYPE_CARDS: VehicleCategoryItem[] = [
  {
    id: 'car',
    value: 'Car',
    title: 'Car',
    image: require('../../../assets/images/vehicles/car.png'),
  },
  {
    id: 'bike',
    value: 'Bike',
    title: 'Bike',
    image: require('../../../assets/images/vehicles/bike.png'),
  },
  {
    id: 'three_wheeler',
    value: 'Three-Wheeler',
    title: 'Three-Wheeler',
    image: require('../../../assets/images/vehicles/three_wheeler.png'),
  },
  {
    id: 'van_suv',
    value: 'Van / SUV',
    title: 'Van / SUV',
    image: require('../../../assets/images/vehicles/van.png'),
  },
  {
    id: 'truck',
    value: 'Truck',
    title: 'Truck',
    image: require('../../../assets/images/vehicles/truck.png'),
  },
];

export interface VehicleTypeCardsProps {
  /**
   * Currently selected category value (e.g., 'Car', 'Bike').
   */
  selectedCategory?: string;

  /**
   * Callback fired with selected category item data when a card is tapped.
   */
  onSelectCategory: (category: VehicleCategoryItem) => void;

  /**
   * Optional custom categories array (defaults to VEHICLE_TYPE_CARDS).
   */
  categories?: VehicleCategoryItem[];

  /**
   * Optional section title. Defaults to "Vehicle Type".
   */
  label?: string;

  /**
   * Optional container style overrides.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Rich, image-based Vehicle Type Card Selector
 * Replaces plain text pills with visual category cards in a horizontal scrollable row.
 */
export const VehicleTypeCards: React.FC<VehicleTypeCardsProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = VEHICLE_TYPE_CARDS,
  label = 'Vehicle Type',
  style,
}) => {
  const [internalSelected, setInternalSelected] = useState<string>(
    selectedCategory || (categories.length > 0 ? categories[0].value : 'Car')
  );

  const activeValue = selectedCategory !== undefined ? selectedCategory : internalSelected;

  const handleCardPress = (item: VehicleCategoryItem) => {
    setInternalSelected(item.value);
    onSelectCategory(item);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        {categories.map((item) => {
          const isSelected =
            activeValue?.toLowerCase() === item.value.toLowerCase() ||
            activeValue?.toLowerCase() === item.id.toLowerCase();

          const imageSource =
            typeof item.image === 'string' ? { uri: item.image } : item.image;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.82}
              onPress={() => handleCardPress(item)}
              style={[styles.card, isSelected && styles.cardSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={item.title}>
              {/* Active Selection Glow Overlay */}
              {isSelected && <View style={styles.activeOverlay} pointerEvents="none" />}

              {/* Selection Indicator Badge */}
              <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {isSelected ? '✓' : ''}
                </Text>
              </View>

              {/* Prominent Vehicle Illustration */}
              <View style={styles.imageContainer}>
                <Image
                  source={imageSource}
                  style={styles.vehicleImage}
                  resizeMode="contain"
                />
              </View>

              {/* Category Title Below the Image */}
              <View style={styles.labelContainer}>
                <Text
                  style={[styles.title, isSelected && styles.titleSelected]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default VehicleTypeCards;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  scrollContainer: {
    paddingRight: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  card: {
    width: 142,
    height: 144,
    backgroundColor: '#162032',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#243247',
    padding: 10,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#172554',
    borderWidth: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  activeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#2D3E56',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 11,
  },
  badgeTextSelected: {
    color: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  labelContainer: {
    paddingTop: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titleSelected: {
    color: '#FFFFFF',
  },
});
