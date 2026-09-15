/**
 * VehicleCare Design System Tokens & Compatibility Definitions
 * Single source of truth for spacing, typography, radii, touch targets, and colors.
 */

import { Platform } from 'react-native';

export interface ThemeColors {
  mode: 'light' | 'dark';
  background: string;
  backgroundAlt: string;
  surface: string;
  surface2: string;
  card: string;
  cardHighlight: string;
  border: string;
  borderSoft: string;
  primaryBlue: string;
  blueDim: string;
  blueSoft: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  iconBg: string;
  tabBar: string;
  tabBarBorder: string;
  modalOverlay: string;
  inputBg: string;
  inputBorder: string;
  sectionHeader: string;
  success: string;
  warning: string;
  error: string;
  cardShadow: string;
  // Compatibility aliases
  text: string;
  backgroundElement: string;
  backgroundSelected: string;
}

export const LightThemeColors: ThemeColors = {
  mode: 'light',
  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',
  surface: '#FFFFFF',
  surface2: '#F8FAFC',
  card: '#FFFFFF',
  cardHighlight: '#EFF6FF',
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',
  primaryBlue: '#2563EB',
  blueDim: '#93C5FD',
  blueSoft: '#EFF6FF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  iconBg: '#F1F5F9',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  modalOverlay: 'rgba(15, 23, 42, 0.45)',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  sectionHeader: '#1E293B',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  text: '#0F172A',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#EFF6FF',
};

export const DarkThemeColors: ThemeColors = {
  mode: 'dark',
  background: '#0B111E',
  backgroundAlt: '#10192A',
  surface: '#131D31',
  surface2: '#18243D',
  card: '#152138',
  cardHighlight: '#1E2D4E',
  border: '#233354',
  borderSoft: '#1A2843',
  primaryBlue: '#3B82F6',
  blueDim: '#1D4ED8',
  blueSoft: 'rgba(37, 99, 235, 0.2)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  iconBg: '#1C2942',
  tabBar: '#0D1527',
  tabBarBorder: '#1E2D4A',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  inputBg: '#0F1829',
  inputBorder: '#2B3D63',
  sectionHeader: '#94A3B8',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  cardShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
  text: '#F8FAFC',
  backgroundElement: '#131D31',
  backgroundSelected: '#1E2D4E',
};

export const Colors = {
  background: LightThemeColors.background,
  backgroundAlt: LightThemeColors.backgroundAlt,
  surface: LightThemeColors.surface,
  surface2: LightThemeColors.surface2,
  card: LightThemeColors.card,
  border: LightThemeColors.border,
  borderSoft: LightThemeColors.borderSoft,
  primaryBlue: LightThemeColors.primaryBlue,
  blueDim: LightThemeColors.blueDim,
  textPrimary: LightThemeColors.textPrimary,
  textDim: LightThemeColors.textMuted,
  textFaint: LightThemeColors.textFaint,
  success: LightThemeColors.success,
  warning: LightThemeColors.warning,
  error: LightThemeColors.error,

  // Theme compatibility aliases
  light: {
    text: LightThemeColors.textPrimary,
    background: LightThemeColors.background,
    backgroundElement: LightThemeColors.surface,
    backgroundSelected: LightThemeColors.cardHighlight,
    textSecondary: LightThemeColors.textSecondary,
  },
  dark: {
    text: DarkThemeColors.textPrimary,
    background: DarkThemeColors.background,
    backgroundElement: DarkThemeColors.surface,
    backgroundSelected: DarkThemeColors.cardHighlight,
    textSecondary: DarkThemeColors.textSecondary,
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
