import React, { useRef } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';

interface DatePickerFieldProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
}

const CalendarIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#2563EB" strokeWidth="2" />
    <Path d="M16 2V6M8 2V6M3 10H21" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  error,
  value,
  onChangeText,
  containerStyle,
  wrapperStyle,
  style,
  placeholder = 'YYYY-MM-DD',
  ...inputProps
}) => {
  const webInputRef = useRef<HTMLInputElement | null>(null);
  const [showNativePicker, setShowNativePicker] = React.useState(false);

  const openPicker = () => {
    if (Platform.OS === 'web') {
      webInputRef.current?.showPicker?.();
    } else {
      setShowNativePicker(true);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrapper, error && styles.wrapperError, wrapperStyle]}>
        <TextInput
          {...inputProps}
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textFaint}
          inputMode="numeric"
        />
        <TouchableOpacity
          accessibilityLabel={`Open date picker${label ? ` for ${label}` : ''}`}
          accessibilityRole="button"
          activeOpacity={0.7}
          style={styles.iconButton}
          onPress={openPicker}>
          <CalendarIcon />
        </TouchableOpacity>
        {Platform.OS === 'web' && (
          <input
            ref={webInputRef}
            type="date"
            value={value}
            onChange={(event) => onChangeText(event.currentTarget.value)}
            aria-label={label || 'Date'}
            style={styles.webInput as React.CSSProperties}
          />
        )}
      </View>
      {showNativePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowNativePicker(false);
            if (event.type === 'set' && date) onChangeText(formatDate(date));
          }}
        />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.p16,
  },
  label: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  wrapper: {
    position: 'relative',
    minHeight: MinTouchTarget,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  wrapperError: {
    borderColor: Colors.error,
  },
  input: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.p16,
    paddingRight: 52,
    color: '#000',
    fontSize: FontSizes.base,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  iconButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  webInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.p4,
  },
});
