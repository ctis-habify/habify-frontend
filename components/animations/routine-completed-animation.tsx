import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  routineName?: string;
  rewardText?: string;
  onComplete: () => void;
};

export function RoutineCompletedAnimation({
  visible,
  routineName,
  rewardText,
  onComplete,
}: Props): React.ReactElement | null {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  const sparkles = useMemo(
    () => [
      { top: 18, left: 24, icon: 'sparkles' as const, delay: 40 },
      { top: 78, right: 26, icon: 'star' as const, delay: 140 },
      { top: 98, right: 42, icon: 'sparkles' as const, delay: 230 },
      { bottom: 22, right: 28, icon: 'star' as const, delay: 300 },
    ],
    [],
  );

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0.7);
    opacity.setValue(0);
    sparkle.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 12,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.timing(sparkle, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    return undefined;
  }, [opacity, scale, sparkle, visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <TouchableOpacity
            onPress={onComplete}
            style={styles.closeButton}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-done-circle" size={56} color="#4ade80" />
          </View>
          <Text style={styles.title}>Goal Completed!</Text>
          <Text style={styles.subtitle}>
            Group approved your photo
            {routineName ? ` for "${routineName}"` : ''}.
          </Text>
          {!!rewardText && <Text style={styles.rewardText}>{rewardText}</Text>}
          {sparkles.map((s, idx) => (
            <Animated.View
              key={`${s.icon}-${idx}`}
              style={[
                styles.sparkle,
                s,
                {
                  opacity: sparkle,
                  transform: [
                    {
                      scale: sparkle.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name={s.icon} size={18} color="#facc15" />
            </Animated.View>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 3, 25, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: 'rgba(44, 17, 82, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 2,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 24,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
  },
  rewardText: {
    marginTop: 8,
    color: '#86efac',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  sparkle: {
    position: 'absolute',
  },
});
