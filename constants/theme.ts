import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1E1B4B',
    textSecondary: '#4F46E5',
    textTertiary: '#818CF8',
    white: '#FFFFFF',
    background: '#F5F3FF',
    tint: '#7C3AED',
    icon: '#4F46E5',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#7C3AED',
    primary: '#7C3AED',
    secondary: '#A78BFA',
    success: '#10B981',
    error: '#EF4444',
    border: '#DDD6FE',
    card: '#FAF9FF',
    surface: '#EDE9FE',
    collaborativePrimary: '#DB2777',
    collaborativeGradient: ['#F5F3FF', '#EDE9FE'] as const,
    gold: '#F59E0B',
    warning: '#F97316',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
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
    collaborativePrimary: '#E879F9',
    collaborativeGradient: ['#2E1065', '#581C87'] as const,
    gold: '#fbbf24',
    warning: '#fbbf24',
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
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
