/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1F2937', // Deep Grey for primary text
    background: '#F9FAFB', // Light greyish white for background
    tint: '#7C3AED', // Violet-600
    icon: '#6B7280', // Cool Grey-500
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#7C3AED',
    primary: '#7C3AED',
    secondary: '#8B5CF6', // Violet-500
    success: '#10B981',
    error: '#EF4444',
    border: '#E5E7EB',
    card: '#FFFFFF',
    surface: '#FFFFFF',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827', // Gray-900
    tint: '#A78BFA', // Violet-400
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#A78BFA',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    success: '#34D399',
    error: '#F87171',
    border: '#374151',
    card: '#1F2937', // Gray-800
    surface: '#1F2937',
  },
};

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
