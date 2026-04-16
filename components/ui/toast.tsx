import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  message: string;
  icon?: 'check' | 'bell' | 'warning';
  onHide?: () => void;
  duration?: number;
};

const getIconConfig = (icon: string, colors: any) => {
  switch (icon) {
    case 'bell':
      return { name: 'notifications' as const, color: '#A78BFA' };
    case 'warning':
      return { name: 'warning' as const, color: '#FBBF24' };
    case 'check':
    default:
      return { name: 'checkmark-circle' as const, color: '#4ade80' };
  }
};

export function Toast({ visible, message, icon = 'check', onHide, duration = 3500 }: Props): React.ReactElement | null {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }
  }, [visible, duration, opacity, onHide]);

  if (!visible) return null;

  const iconConfig = getIconConfig(icon, colors);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.content, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
        <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    gap: 12,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
