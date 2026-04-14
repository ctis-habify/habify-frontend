/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#111827', // Gray-900 (Deep dark for maximum readability)
    textSecondary: '#4B5563', // Gray-600
    textTertiary: '#9CA3AF', // Gray-400
    white: '#FFFFFF',
    background: '#FFFFFF',
    tint: '#7C3AED', 
    icon: '#4B5563', 
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#7C3AED',
    primary: '#7C3AED',
    secondary: '#A78BFA', 
    success: '#10B981',
    error: '#EF4444',
    border: '#E5E7EB',
    card: '#FFFFFF',
    surface: '#F9FAFB',
    collaborativePrimary: '#DB2777', // Deep Pink
    collaborativeGradient: ['#FDF4FF', '#FAE8FF'] as const, // Fuchsia-50 -> Fuchsia-100
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
  },
};

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
