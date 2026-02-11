import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'heading1' | 'heading2' | 'caption' | 'label';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps): React.ReactElement {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'defaultSemiBold' && styles.defaultSemiBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'heading1' && styles.heading1,
        type === 'heading2' && styles.heading2,
        type === 'caption' && styles.caption,
        type === 'label' && styles.label,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  heading1: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
