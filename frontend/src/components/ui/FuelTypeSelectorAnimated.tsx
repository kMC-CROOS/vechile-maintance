import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface FuelTypeItem {
  id: string;
  label: string;
  subtitle: string;
  badge: string;
  color: string;
}

export const FUEL_OPTIONS: FuelTypeItem[] = [
  {
    id: 'petrol',
    label: 'Petrol',
    subtitle: 'Gasoline / Unleaded',
    badge: 'Standard',
    color: '#3B82F6',
  },
  {
    id: 'diesel',
    label: 'Diesel',
    subtitle: 'High Torque Diesel',
    badge: 'Turbo',
    color: '#F59E0B',
  },
  {
    id: 'electric',
    label: 'Electric',
    subtitle: 'Zero Emission EV',
    badge: '100% EV',
    color: '#10B981',
  },
  {
    id: 'cng',
    label: 'CNG',
    subtitle: 'Clean Compressed Gas',
    badge: 'Eco Gas',
    color: '#06B6D4',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    subtitle: 'Gas + Electric Dual',
    badge: 'Dual Tech',
    color: '#8B5CF6',
  },
];

// SVG Icons for Fuel Types
const FuelVectorIcon = ({ id, color = '#FFFFFF', size = 22 }: { id: string; color?: string; size?: number }) => {
  if (id === 'electric') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (id === 'cng') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8z" stroke={color} strokeWidth="2" />
        <Path d="M12 8v4l2.5 2.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  if (id === 'hybrid') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18.36 6.64a9 9 0 11-12.73 0" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M12 2v10M12 12l4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (id === 'diesel') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="4" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth="2.2" />
        <Path d="M16 8h3a2 2 0 012 2v6a2 2 0 01-2 2h-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M8 7h4M8 11h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
  // Petrol (default)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 22V4a2 2 0 012-2h6a2 2 0 012 2v18M13 11h4a2 2 0 012 2v5a2 2 0 002 2h0a2 2 0 002-2V9l-3-3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8" cy="8" r="2" fill={color} />
    </Svg>
  );
};

const CheckBadgeIcon = ({ size = 10, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export interface FuelTypeSelectorAnimatedProps {
  selectedFuel?: string;
  onSelectFuel?: (fuelLabel: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const FuelTypeSelectorAnimated: React.FC<FuelTypeSelectorAnimatedProps> = ({
  selectedFuel = 'Petrol',
  onSelectFuel,
  style,
}) => {
  const animValues = useRef(
    FUEL_OPTIONS.map(() => ({
      scale: new Animated.Value(1),
      glowOpacity: new Animated.Value(0),
      iconTranslateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    FUEL_OPTIONS.forEach((item, index) => {
      const isSelected = selectedFuel.toLowerCase() === item.label.toLowerCase();
      const anim = animValues[index];

      Animated.parallel([
        Animated.spring(anim.scale, {
          toValue: isSelected ? 1.04 : 1.0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(anim.glowOpacity, {
          toValue: isSelected ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(anim.iconTranslateY, {
          toValue: isSelected ? -2 : 0,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [selectedFuel]);

  const handlePressIn = (index: number) => {
    Animated.spring(animValues[index].scale, {
      toValue: 0.96,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    const isSelected = selectedFuel.toLowerCase() === FUEL_OPTIONS[index].label.toLowerCase();
    Animated.spring(animValues[index].scale, {
      toValue: isSelected ? 1.04 : 1.0,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Fuel / Energy Type</Text>
        <Text style={styles.sublabel}>Select powertrain specification</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {FUEL_OPTIONS.map((item, index) => {
          const isSelected = selectedFuel.toLowerCase() === item.label.toLowerCase();
          const anim = animValues[index];

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardContainer,
                {
                  transform: [{ scale: anim.scale }],
                },
              ]}>
              <Pressable
                onPress={() => onSelectFuel?.(item.label)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}>
                <View style={[styles.card, isSelected && styles.cardSelected]}>
                  {/* Glow Backdrop Layer */}
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.glowLayer, { opacity: anim.glowOpacity }]}
                  />

                  {/* Header Badge */}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.typeBadge, isSelected && styles.typeBadgeSelected]}>
                      <Text style={[styles.typeBadgeText, isSelected && styles.typeBadgeTextSelected]}>
                        {item.badge}
                      </Text>
                    </View>

                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected ? <CheckBadgeIcon size={10} color="#FFFFFF" /> : null}
                    </View>
                  </View>

                  {/* Icon stage */}
                  <Animated.View
                    style={[
                      styles.iconStage,
                      isSelected && styles.iconStageSelected,
                      { transform: [{ translateY: anim.iconTranslateY }] },
                    ]}>
                    <FuelVectorIcon
                      id={item.id}
                      color={isSelected ? '#FFFFFF' : '#2563EB'}
                      size={22}
                    />
                  </Animated.View>

                  {/* Card Typography */}
                  <View style={styles.cardContent}>
                    <Text style={[styles.title, isSelected && styles.titleSelected]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.subtitle, isSelected && styles.subtitleSelected]}
                      numberOfLines={1}>
                      {item.subtitle}
                    </Text>
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

export default FuelTypeSelectorAnimated;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  headerRow: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.2,
  },
  sublabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 2,
    paddingVertical: 6,
    gap: 12,
  },
  cardContainer: {
    width: 140,
  },
  card: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',

    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,

    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  typeBadgeSelected: {
    backgroundColor: '#2563EB',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  typeBadgeTextSelected: {
    color: '#FFFFFF',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  iconStage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    zIndex: 2,
  },
  iconStageSelected: {
    backgroundColor: '#2563EB',
  },
  cardContent: {
    zIndex: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
  },
  titleSelected: {
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  subtitleSelected: {
    color: '#1D4ED8',
  },
});
