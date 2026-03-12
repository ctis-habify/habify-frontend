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

const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  check: { name: 'checkmark-circle', color: '#4ade80' },
  bell: { name: 'notifications', color: '#A78BFA' },
  warning: { name: 'warning', color: '#FBBF24' },
};

export function Toast({ visible, message, icon = 'check', onHide, duration = 3500 }: Props): React.ReactElement | null {
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

  const { name, color } = iconMap[icon] ?? iconMap.check;

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
      <View style={styles.content}>
        <Ionicons name={name} size={22} color={color} />
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
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
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
    maxWidth: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
