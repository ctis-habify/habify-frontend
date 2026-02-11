import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'surface';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'default', ...otherProps }: ThemedViewProps): React.ReactElement {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, variant === 'default' ? 'background' : (variant === 'card' ? 'card' : 'surface'));
  const borderColor = useThemeColor({}, 'border');
  
  const variantStyle = variant === 'card' ? {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4, // for Android
    borderWidth: 1,
    borderColor: borderColor, // Slight border for definition
  } : {};

  return <View style={[{ backgroundColor }, variantStyle, style]} {...otherProps} />;
}
