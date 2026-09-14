/**
 * VehicleCare Design System Tokens & Compatibility Definitions
 * Single source of truth for spacing, typography, radii, touch targets, and colors.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#0A1220',
  backgroundAlt: '#0E1830',
  surface: '#141F38',
  surface2: '#1B2A47',
  card: '#182545',
  border: '#26375C',
  borderSoft: '#1E2C4C',
  primaryBlue: '#3D82F6',
  blueDim: '#2C5FC7',
  textPrimary: '#F3F6FC',
  textDim: '#94A3C4',
  textFaint: '#5E729B',
  success: '#2DD4A7',
  warning: '#F5A623',
  error: '#F0576B',

  // Theme compatibility aliases
  light: {
    text: '#F3F6FC',
    background: '#0A1220',
    backgroundElement: '#141F38',
    backgroundSelected: '#1B2A47',
    textSecondary: '#94A3C4',
  },
  dark: {
    text: '#F3F6FC',
    background: '#0A1220',
    backgroundElement: '#141F38',
    backgroundSelected: '#1B2A47',
    textSecondary: '#94A3C4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Radii = {
  small: 10,
  medium: 14,
  large: 18,
} as const;

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const Fonts = {
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
  sans: 'normal',
  serif: 'serif',
  rounded: 'normal',
} as const;

export const Spacing = {
  // Legacy aliases
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  // Scale tokens
  p4: 4,
  p8: 8,
  p12: 12,
  p16: 16,
  p20: 20,
  p24: 24,
  p32: 32,
  p40: 40,
  // Semantic aliases
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  max: 40,
  // Layout specific
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 20,
  itemGap: 12,
} as const;

export const MinTouchTarget = 44;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
