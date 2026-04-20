import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface AnimatedToggleProps {
  label?: string;
  isEnabled: boolean;
  onToggle: () => void;
  activeColor?: string;
  inactiveColor?: string;
  labelColor?: string;
}

const TOGGLE_WIDTH = 50;
const TOGGLE_HEIGHT = 30;
const CIRCLE_SIZE = 24;
const PADDING = (TOGGLE_HEIGHT - CIRCLE_SIZE) / 2;

export function AnimatedToggle({
  label,
  isEnabled,
  onToggle,
  activeColor,
  inactiveColor,
  labelColor,
}: AnimatedToggleProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  
  const progress = useSharedValue(isEnabled ? 1 : 0);

  const effectiveActiveColor = activeColor || colors.primary;
  const effectiveInactiveColor = inactiveColor || colors.border;
  const effectiveLabelColor = labelColor || colors.text;

  useEffect(() => {
    progress.value = withSpring(isEnabled ? 1 : 0, {
        mass: 1,
        damping: 15,
        stiffness: 120,
    });
  }, [isEnabled, progress]);

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [effectiveInactiveColor, effectiveActiveColor]
    );
    return { backgroundColor };
  });

  const circleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(isEnabled ? TOGGLE_WIDTH - CIRCLE_SIZE - PADDING : PADDING, {
              mass: 1,
              damping: 15,
              stiffness: 120,
          }),
        },
      ],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={onToggle}>
      <View style={styles.container}>
        {label && <Text style={[styles.label, { color: effectiveLabelColor }]}>{label}</Text>}
        <Animated.View style={[styles.track, trackStyle]}>
          <Animated.View style={[styles.circle, circleStyle, { backgroundColor: colors.white, shadowColor: colors.text }]} />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  track: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    position: 'absolute',
    left: 0, // Animated via transform
  },
});
