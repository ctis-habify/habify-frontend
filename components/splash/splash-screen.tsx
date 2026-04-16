import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function SplashScreen(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);
  const float = useSharedValue(0);
  const titleIntro = useSharedValue(0);

  const splashGradient = isDark 
    ? ['#0F172A', '#1E1B4B', '#2E1065'] as const
    : ['#ffffff', '#f5f3ff', '#ede9fe'] as const;

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
    float.value = withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.cubic) }), -1, true);
    titleIntro.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.2)) });
  }, [float, pulse, spin, titleIntro]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.5], Extrapolation.CLAMP),
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.55, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -6], Extrapolation.CLAMP) }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(titleIntro.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(titleIntro.value, [0, 1], [0.72, 1.08], Extrapolation.CLAMP) },
      { scale: interpolate(pulse.value, [0, 1], [0.98, 1.03], Extrapolation.CLAMP) },
    ],
  }));

  const iconFloatA = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -5], Extrapolation.CLAMP) }],
  }));

  const iconFloatB = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [-4, 2], Extrapolation.CLAMP) }],
  }));

  const iconFloatC = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [1, -4], Extrapolation.CLAMP) }],
  }));

  const iconFloatD = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [-2, 3], Extrapolation.CLAMP) }],
  }));

  const logoCardFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -4], Extrapolation.CLAMP) }],
    opacity: interpolate(pulse.value, [0, 1], [0.9, 1], Extrapolation.CLAMP),
  }));

  const orbitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const chipBg = isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.12)';
  const ringColor = isDark ? 'rgba(167, 139, 250, 0.3)' : 'rgba(124, 58, 237, 0.35)';

  return (
    <LinearGradient colors={splashGradient} style={styles.container}>
      <Animated.View style={[styles.heroCluster, logoCardFloatStyle]}>
        <Animated.View style={[styles.rotatingRing, ringAnimatedStyle, { borderColor: ringColor }]} />

        <Animated.View style={[styles.iconOrbit, orbitAnimatedStyle]}>
          <Animated.View style={[styles.orbitItemTop, iconFloatA]}>
            <View style={[styles.routineIconChip, { backgroundColor: chipBg }]}>
              <Ionicons name="musical-notes" size={14} color={isDark ? '#A78BFA' : '#8b5cf6'} />
            </View>
          </Animated.View>
          <Animated.View style={[styles.orbitItemRight, iconFloatB]}>
            <View style={[styles.routineIconChip, { backgroundColor: chipBg }]}>
              <Ionicons name="camera" size={14} color={isDark ? '#60A5FA' : '#3b82f6'} />
            </View>
          </Animated.View>
          <Animated.View style={[styles.orbitItemBottom, iconFloatC]}>
            <View style={[styles.routineIconChip, { backgroundColor: chipBg }]}>
              <Ionicons name="barbell" size={14} color={isDark ? '#FBBF24' : '#f59e0b'} />
            </View>
          </Animated.View>
          <Animated.View style={[styles.orbitItemLeft, iconFloatD]}>
            <View style={[styles.routineIconChip, { backgroundColor: chipBg }]}>
              <Ionicons name="time" size={14} color={isDark ? '#34D399' : '#10b981'} />
            </View>
          </Animated.View>
        </Animated.View>

        <Image
          source={require('../../assets/images/habify-logo-transparent-h-focus.png')}
          style={styles.brandLogoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text style={[styles.title, titleAnimatedStyle, { color: isDark ? colors.primary : '#5b21b6' }]}>Habify</Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle, { color: isDark ? colors.secondary : '#7c3aed' }]}>Level up your day!</Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCluster: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.35)',
  },
  title: {
    marginTop: 12,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#5b21b6',
  },
  subtitle: {
    marginTop: 10,
    color: '#7c3aed',
    fontSize: 15,
    fontWeight: '700',
  },
  iconOrbit: {
    position: 'absolute',
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitItemTop: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -14,
    marginTop: -14,
  },
  orbitItemRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -14,
    marginRight: -14,
  },
  orbitItemBottom: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -14,
    marginBottom: -14,
  },
  orbitItemLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -14,
    marginLeft: -14,
  },
  brandLogoImage: {
    width: 160,
    height: 160,
    opacity: 1,
  },
  routineIconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
