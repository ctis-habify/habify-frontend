/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1E1B4B', // Midnight Indigo
    textSecondary: '#4F46E5', // Indigo-600
    textTertiary: '#818CF8', // Indigo-400
    white: '#FFFFFF',
    background: '#F5F3FF', // Lavender-50
    tint: '#7C3AED', 
    icon: '#4F46E5', 
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#7C3AED',
    primary: '#7C3AED', // Violet-600
    secondary: '#A78BFA', // Violet-400
    success: '#10B981',
    error: '#EF4444',
    border: '#DDD6FE', // Lavender-200
    card: '#FAF9FF', // Subtle Lavender tint (Avoids pure white)
    surface: '#EDE9FE', // Lavender-100 (For fields/chips)
    collaborativePrimary: '#DB2777', // Deep Pink
    collaborativeGradient: ['#F5F3FF', '#EDE9FE'] as const, // Consistent lavender gradient
    gold: '#F59E0B',
    warning: '#F97316',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#D1D5DB', // Gray-300
    textTertiary: '#9CA3AF', // Gray-400
    white: '#FFFFFF',
    background: '#0F172A',
    tint: '#A78BFA',
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#A78BFA',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    success: '#34D399',
    error: '#F87171',
    border: 'rgba(167, 139, 250, 0.25)',
    card: '#1E1B4B',
    surface: '#1E1B4B',
    collaborativePrimary: '#E879F9', // Fuchsia-400
    collaborativeGradient: ['#2E1065', '#581C87'] as const, // Violet-950 -> Violet-900
    gold: '#fbbf24',
    warning: '#fbbf24',
  },
};

export type ThemeColors = typeof Colors.light;

export const BrandColors = {
  gradientTop: '#A78BFA', 
  gradientBottom: '#C4B5FD', 
};

export const BACKGROUND_GRADIENT = [
  BrandColors.gradientTop,
  BrandColors.gradientBottom,
] as const;

export const BACKGROUND_GRADIENT_DARK = ['#1E1B4B', '#0F172A'] as const;

export function getBackgroundGradient(
  theme: 'light' | 'dark', 
  section: 'personal' | 'collaborative' = 'personal'
): readonly [string, string] {
  if (section === 'collaborative') {
    return Colors[theme].collaborativeGradient;
  }
  return theme === 'dark' ? BACKGROUND_GRADIENT_DARK : BACKGROUND_GRADIENT;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
