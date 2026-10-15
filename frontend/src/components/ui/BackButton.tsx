import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  BackHandler,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { FontSizes, MinTouchTarget } from '@/constants/theme';

export interface BackButtonProps {
  label?: string;
  fallbackRoute?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  enableHardwareBack?: boolean;
  onPress?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = '← Back',
  fallbackRoute = '/(tabs)/more',
  style,
  textStyle,
  enableHardwareBack = true,
  onPress,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ from?: string }>();
  const from = params?.from;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return true;
    }
    if (from === 'more') {
      router.navigate('/(tabs)/more' as any);
    } else if (from === 'home') {
      router.navigate('/(tabs)' as any);
    } else {
      router.navigate((fallbackRoute || '/(tabs)/more') as any);
    }
    return true;
  }, [router, from, fallbackRoute, onPress]);

  useFocusEffect(
    useCallback(() => {
      let subscription: any;
      if (enableHardwareBack && Platform.OS === 'android') {
        subscription = BackHandler.addEventListener('hardwareBackPress', () => {
          handlePress();
          return true;
        });
      }

      return () => {
        subscription?.remove?.();
        try {
          router.setParams({ from: '' });
        } catch {
          // ignore
        }
      };
    }, [enableHardwareBack, handlePress, router])
  );

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={(e) => {
        e?.preventDefault?.();
        handlePress();
      }}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={[styles.text, { color: theme.primaryBlue }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: MinTouchTarget,
    minWidth: MinTouchTarget,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});

export default BackButton;
