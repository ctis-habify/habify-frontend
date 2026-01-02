import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  isLoading = false, 
  disabled = false, 
  style, 
  textStyle,
  icon 
}: ButtonProps) {

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  
  // Define colors based on variant
  // Define colors based on variant
  const getColors = (): [string, string] | undefined => {
    if (disabled) return ['#9CA3AF', '#6B7280']; // Grey disabled state
    switch (variant) {
      case 'primary':
        return [Colors.light.primary, Colors.light.secondary];
      case 'secondary':
        return [Colors.light.secondary, '#8B5CF6'];
      default:
        return undefined; // Transparent for outline/ghost
    }
  };

  const gradientColors = getColors();

  const Container = gradientColors ? LinearGradient : TouchableOpacity;
  const containerProps = gradientColors ? { colors: gradientColors, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={[
        styles.touchableBase,
        isOutline && styles.outlineButton,
        disabled && styles.disabledButton,
        style
      ]}
    >
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.contentContainer}
        >
          <Content title={title} isLoading={isLoading} textStyle={textStyle} variant={variant} icon={icon} />
        </LinearGradient>
      ) : (
        <View style={styles.contentContainer}>
          <Content title={title} isLoading={isLoading} textStyle={textStyle} variant={variant} icon={icon} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function Content({ title, isLoading, textStyle, variant, icon }: { title: string, isLoading: boolean, textStyle?: TextStyle, variant: ButtonVariant, icon?: React.ReactNode }) {
  const textColor = variant === 'outline' || variant === 'ghost' ? Colors.light.primary : '#FFFFFF';
  
  return (
    <>
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <ThemedText style={[styles.textBase, { color: textColor }, textStyle]}>
            {title}
          </ThemedText>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  touchableBase: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  contentContainer: {
    minHeight: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  textBase: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
