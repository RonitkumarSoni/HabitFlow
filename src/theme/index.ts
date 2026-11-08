/**
 * HabitFlow Theme Configuration
 * Inspired by the warm paper aesthetic of the prototype with full dark mode support.
 */

export const LightColors = {
  background: '#F5F3EE', // Warm linen background
  surface: '#FFFFFF',    // Clean card surface
  surfaceSubtle: '#EFEBE2',
  border: '#E8E4DB',
  borderFocus: '#0B7A5E',
  text: '#16181D',        // Deep ink
  textSecondary: '#5F636B',
  textMuted: '#9BA0A8',
  primary: '#0B7A5E',     // HabitFlow signature emerald
  primaryLight: '#E3F1EC',
  primaryDark: '#085C47',
  streak: '#E4572E',      // Flame orange
  streakLight: '#FBE9E3',
  danger: '#D4451F',
  dangerLight: '#FBE9E3',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  accentBlue: '#1F6FEB',
  accentBlueLight: '#E4EEFD',
  cardShadow: 'rgba(22, 24, 29, 0.04)',
};

export const DarkColors = {
  background: '#121316', // Deep slate
  surface: '#1A1D24',    // Elevated card
  surfaceSubtle: '#222630',
  border: '#2A2E39',
  borderFocus: '#10B981',
  text: '#F5F3EE',
  textSecondary: '#A1A6B2',
  textMuted: '#6C7280',
  primary: '#10B981',
  primaryLight: '#064E3B',
  primaryDark: '#0B7A5E',
  streak: '#F97316',
  streakLight: '#431407',
  danger: '#EF4444',
  dangerLight: '#450A0A',
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#F59E0B',
  warningLight: '#451A03',
  accentBlue: '#38BDF8',
  accentBlueLight: '#082F49',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
};

export type ThemeColors = typeof LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  full: 9999,
};

export const Typography = {
  family: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 32,
  },
};

export const HABIT_COLORS = [
  '#0B7A5E', // Emerald
  '#E4572E', // Terracotta / Flame
  '#1F6FEB', // Cobalt Blue
  '#7C3AED', // Royal Purple
  '#D97706', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#10B981', // Mint Green
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const HABIT_ICONS = [
  { name: 'book-outline', label: 'Reading' },
  { name: 'fitness-outline', label: 'Workout' },
  { name: 'water-outline', label: 'Hydration' },
  { name: 'walk-outline', label: 'Steps' },
  { name: 'bicycle-outline', label: 'Cycling' },
  { name: 'moon-outline', label: 'Sleep' },
  { name: 'restaurant-outline', label: 'Nutrition' },
  { name: 'journal-outline', label: 'Journaling' },
  { name: 'code-slash-outline', label: 'Coding' },
  { name: 'musical-notes-outline', label: 'Music' },
  { name: 'leaf-outline', label: 'Meditation' },
  { name: 'heart-outline', label: 'Self-care' },
  { name: 'alarm-outline', label: 'Wake up' },
  { name: 'brush-outline', label: 'Creativity' },
  { name: 'checkbox-outline', label: 'General' },
];

