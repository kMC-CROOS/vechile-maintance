import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AnimatedPressableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedPressableCard: React.FC<AnimatedPressableCardProps> = ({
  children,
  onPress,
  style,
  disabled = false,
  scaleTo = 0.97,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || !onPress) return;
    scale.value = withSpring(scaleTo, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
  };

  const handlePressOut = () => {
    if (disabled || !onPress) return;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      style={[style, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}>
      {children}
    </AnimatedPressable>
  );
};
