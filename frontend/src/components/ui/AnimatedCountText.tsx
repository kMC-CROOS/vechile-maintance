import React, { useEffect, useRef } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface AnimatedCountTextProps {
  value: string | number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCountText: React.FC<AnimatedCountTextProps> = ({
  value,
  style,
  numberOfLines,
  prefix = '',
  suffix = '',
}) => {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const prevValue = useRef(value);
  const displayVal = `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}${suffix}`;

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      // Quick subtle cross-fade with slight vertical shift (180ms)
      opacity.value = withSequence(
        withTiming(0.2, { duration: 90, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 110, easing: Easing.in(Easing.ease) })
      );
      translateY.value = withSequence(
        withTiming(-4, { duration: 90 }),
        withTiming(0, { duration: 110, easing: Easing.out(Easing.back(1.5)) })
      );
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[style, animatedStyle]} numberOfLines={numberOfLines}>
      {displayVal}
    </Animated.Text>
  );
};
