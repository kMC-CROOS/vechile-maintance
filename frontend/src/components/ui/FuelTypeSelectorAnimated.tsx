import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';

export interface FuelTypeItem {
  id: string;
  label: string;
  subtitle: string;
  badge: string;
}

export const FUEL_OPTIONS: FuelTypeItem[] = [
  {
    id: 'petrol',
    label: 'Petrol',
    subtitle: 'Gasoline / Unleaded',
    badge: 'Standard',
  },
  {
    id: 'diesel',
    label: 'Diesel',
    subtitle: 'High Torque Diesel',
    badge: 'Turbo',
  },
  {
    id: 'electric',
    label: 'Electric',
    subtitle: 'Zero Emission EV',
    badge: '100% EV',
  },
  {
    id: 'cng',
    label: 'CNG',
    subtitle: 'Clean Compressed Gas',
    badge: 'Eco Gas',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    subtitle: 'Gas + Electric Dual',
    badge: 'Dual Tech',
  },
];

const COMPACT_BREAKPOINT = 600;

const FuelVectorIcon = ({ id, color, size = 22 }: { id: string; color: string; size?: number }) => {
  if (id === 'electric') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={color}
          d="M13.4 2.15a.9.9 0 0 1 .86 1.28L11.7 9.5H18a.9.9 0 0 1 .7 1.47l-8.7 10.7a.9.9 0 0 1-1.62-.72L10.3 14H6a.9.9 0 0 1-.7-1.47l8.4-10.2a.9.9 0 0 1 .7-.18z"
        />
      </Svg>
    );
  }
  if (id === 'cng') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={color}
          d="M12 2.2c1.7 2.4 2.7 4.5 2.7 6.4 0 1.1-.4 2.1-1.1 2.9 2.3-.4 4.2-2.3 4.2-5 0-.5-.1-1-.2-1.4C19.8 7.6 21 10.4 21 13.3 21 18 17 22 12 22S3 18 3 13.3C3 8.4 6.6 4.2 12 2.2zm0 8.4c-1.4 1.1-2.2 2.6-2.2 4.2 0 2 1.6 3.5 3.5 3.5.6 0 1.1-.1 1.6-.4-1.8-1-2.9-2.9-2.9-5.1 0-.8.2-1.5.5-2.2-.2 0-.4 0-.5 0z"
        />
      </Svg>
    );
  }
  if (id === 'hybrid') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={color}
          d="M20.6 4.1c.3 1.7 0 4.3-2.2 7.2-2.4 3.2-6.1 5.7-10.3 6.6-.6 1.2-1.1 2.3-1.4 3.2l-1.9-.5c.4-1.3 1-2.8 1.8-4.4C3.2 14.4 3 11.4 4.5 8.7 6.4 5.3 10.5 3.8 17.8 3c1.1-.1 2 .1 2.8 1.1zM9.3 15.3c3.2-.9 5.9-2.8 7.7-5.2 1.3-1.8 1.9-3.5 2.1-4.8-5.4.9-8.7 2.5-10.1 5-1 1.8-.9 3.6.3 5z"
        />
        <Path
          fill={color}
          d="M8.2 13.1c2.1-1.1 4.6-3.4 5.8-5.8l1.6.8c-1.5 3-4.4 5.6-6.9 6.9l-.5-1.9z"
        />
      </Svg>
    );
  }
  if (id === 'diesel') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill={color}
          d="M12 2.2C7.2 7.1 4.5 11 4.5 14.6c0 4.3 3.3 7.2 7.5 7.2s7.5-2.9 7.5-7.2c0-3.6-2.7-7.5-7.5-12.4z"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M7.5 3A2.5 2.5 0 0 0 5 5.5V20H4a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2h-1V5.5A2.5 2.5 0 0 0 10.5 3h-3zm1 4h4V5.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5V7z"
      />
      <Path
        fill={color}
        d="M15 10.2 17.8 7.4a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4L18.5 11.7V16a2 2 0 0 0 2 2h.5a1 1 0 1 1 0 2h-.5a4 4 0 0 1-4-4v-5.8z"
      />
    </Svg>
  );
};

const CheckBadgeIcon = ({ size = 10, color }: { size?: number; color: string }) => (
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
  const { width } = useWindowDimensions();
  const { theme } = useAppTheme();
  const compact = width < COMPACT_BREAKPOINT;
  const [rowWidth, setRowWidth] = useState(0);
  const onPrimary = theme.mode === 'dark' ? theme.textPrimary : theme.surface;

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
          toValue: isSelected && !compact ? 1.04 : 1,
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
          toValue: isSelected && !compact ? -2 : 0,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [selectedFuel, compact, animValues]);

  const handlePressIn = (index: number) => {
    Animated.spring(animValues[index].scale, {
      toValue: compact ? 0.98 : 0.96,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    const isSelected = selectedFuel.toLowerCase() === FUEL_OPTIONS[index].label.toLowerCase();
    Animated.spring(animValues[index].scale, {
      toValue: isSelected && !compact ? 1.04 : 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  const selectedOption = FUEL_OPTIONS.find(
    (item) => selectedFuel.toLowerCase() === item.label.toLowerCase()
  );

  const cardWidth = rowWidth > 0 ? (rowWidth - 6 * (FUEL_OPTIONS.length - 1)) / FUEL_OPTIONS.length : 0;
  const textWidth = Math.max(cardWidth - 6, 0);
  const fittedTitle = textWidth > 0 ? textWidth / (8 * 0.62) : 11;
  const compactTitleSize = Math.min(12, Math.max(8, fittedTitle >= 11.5 ? 12 : Math.min(11, fittedTitle)));

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>Fuel / Energy Type</Text>
        <Text style={[styles.sublabel, { color: theme.textMuted }]}>Select powertrain specification</Text>
      </View>

      <View style={styles.row} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
        {FUEL_OPTIONS.map((item, index) => {
          const isSelected = selectedFuel.toLowerCase() === item.label.toLowerCase();
          const anim = animValues[index];
          const iconColor = isSelected ? theme.onSuccess : theme.success;

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardSlot,
                { transform: [{ scale: anim.scale }] },
              ]}>
              <Pressable
                style={styles.pressable}
                onPress={() => onSelectFuel?.(item.label)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}, ${item.subtitle}`}
                accessibilityState={{ selected: isSelected }}>
                <View
                  style={[
                    styles.card,
                    compact ? styles.cardCompact : styles.cardWide,
                    {
                      backgroundColor: isSelected ? theme.cardHighlight : theme.surface,
                      borderColor: isSelected ? theme.primaryBlue : theme.border,
                      boxShadow: theme.cardShadow,
                    },
                  ]}>
                  <Animated.View
                    style={[
                      styles.glowLayer,
                      { backgroundColor: theme.blueSoft, opacity: anim.glowOpacity },
                    ]}
                  />

                  {compact && isSelected ? (
                    <View style={[styles.cornerCheck, { backgroundColor: theme.primaryBlue }]}>
                      <CheckBadgeIcon size={8} color={onPrimary} />
                    </View>
                  ) : null}

                  {!compact ? (
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: isSelected ? theme.primaryBlue : theme.iconBg },
                        ]}>
                        <Text
                          style={[
                            styles.typeBadgeText,
                            { color: isSelected ? onPrimary : theme.textMuted },
                          ]}
                          numberOfLines={1}>
                          {item.badge}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkCircle,
                          {
                            borderColor: isSelected ? theme.primaryBlue : theme.inputBorder,
                            backgroundColor: isSelected ? theme.primaryBlue : theme.surface,
                          },
                        ]}>
                        {isSelected ? <CheckBadgeIcon size={10} color={onPrimary} /> : null}
                      </View>
                    </View>
                  ) : null}

                  <Animated.View
                    style={[
                      compact ? styles.iconStageCompact : styles.iconStage,
                      {
                        backgroundColor: isSelected ? theme.success : theme.successBg,
                        transform: [{ translateY: anim.iconTranslateY }],
                      },
                    ]}>
                    <FuelVectorIcon id={item.id} color={iconColor} size={compact ? 28 : 22} />
                  </Animated.View>

                  <View style={[styles.cardContent, compact && styles.cardContentCompact]}>
                    <Text
                      style={[
                        compact ? styles.titleCompact : styles.title,
                        compact ? { fontSize: compactTitleSize } : null,
                        { color: isSelected ? theme.primaryBlue : theme.textPrimary },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}>
                      {item.label}
                    </Text>
                    {!compact ? (
                      <Text
                        style={[
                          styles.subtitle,
                          { color: isSelected ? theme.primaryBlue : theme.textMuted },
                        ]}
                        numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {compact ? (
        <Text
          style={[styles.selectionLine, { color: theme.textSecondary }]}
          numberOfLines={1}>
          {selectedOption
            ? `${selectedOption.label} · ${selectedOption.subtitle}`
            : selectedFuel}
        </Text>
      ) : null}
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
    letterSpacing: -0.2,
  },
  sublabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  cardSlot: {
    flex: 1,
    minWidth: 0,
  },
  pressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  cardCompact: {
    minHeight: 84,
    paddingHorizontal: 2,
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardWide: {
    minHeight: 140,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'space-between',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  cornerCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    gap: 4,
  },
  typeBadge: {
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStage: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    zIndex: 2,
  },
  iconStageCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardContent: {
    zIndex: 2,
  },
  cardContentCompact: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  selectionLine: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
