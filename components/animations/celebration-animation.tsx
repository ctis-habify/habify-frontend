import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View, Image } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export interface CelebrationAnimationProps {
    readonly play: boolean;
    readonly triggerKey?: number; // Used to re-trigger
    readonly onComplete?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 100; // Even more festive

const CELEBRATION_COLORS = [
    '#FFD700', // Gold
    '#FFA500', // Orange
    '#FF4500', // OrangeRed
    '#FF1493', // DeepPink
    '#00BFFF', // DeepSkyBlue
    '#32CD32', // LimeGreen
    '#A855F7', // Purple
];

interface ParticleConfig {
    readonly startX: number;
    readonly targetX: number;
    readonly peakY: number;
    readonly durationUp: number;
    readonly durationDown: number;
    readonly color: string;
    readonly size: number;
    readonly widthMultiplier: number;
    readonly delay: number;
    readonly shape: 'circle' | 'rectangle';
    readonly spinSpeedX: number;
    readonly spinSpeedY: number;
    readonly spinSpeedZ: number;
}

interface ParticleProps {
    readonly config: ParticleConfig;
    readonly play: boolean;
}

function Particle({ config, play }: ParticleProps): React.ReactElement {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const rotateZ = useSharedValue(0);

    useEffect(() => {
        if (play) {
            // Start from center-bottom of screen
            const startY = SCREEN_HEIGHT / 2 + 100;
            const endY = SCREEN_HEIGHT + 100;

            translateX.value = config.startX;
            translateY.value = startY;

            const totalDuration = config.durationUp + config.durationDown;

            opacity.value = withDelay(
                config.delay,
                withSequence(
                    withTiming(1, { duration: 50 }),
                    withDelay(totalDuration - 400, withTiming(0, { duration: 350 })),
                ),
            );

            scale.value = withDelay(
                config.delay,
                withSequence(
                    withSpring(1, { damping: 10, stiffness: 200 }),
                    withDelay(totalDuration - 300, withTiming(0, { duration: 300 })),
                ),
            );

            translateX.value = withDelay(
                config.delay,
                withTiming(config.targetX, { duration: totalDuration, easing: Easing.out(Easing.quad) })
            );

            translateY.value = withDelay(
                config.delay,
                withSequence(
                    withTiming(config.peakY, { duration: config.durationUp, easing: Easing.out(Easing.cubic) }),
                    withTiming(endY, { duration: config.durationDown, easing: Easing.in(Easing.quad) })
                )
            );

            rotateX.value = withDelay(
                config.delay,
                withTiming(config.spinSpeedX * 360, { duration: totalDuration, easing: Easing.linear })
            );
            rotateY.value = withDelay(
                config.delay,
                withTiming(config.spinSpeedY * 360, { duration: totalDuration, easing: Easing.linear })
            );
            rotateZ.value = withDelay(
                config.delay,
                withTiming(config.spinSpeedZ * 360, { duration: totalDuration, easing: Easing.linear })
            );
        }
    }, [play, config]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotateX: `${rotateX.value}deg` },
            { rotateY: `${rotateY.value}deg` },
            { rotateZ: `${rotateZ.value}deg` },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    width: config.size * config.widthMultiplier,
                    height: config.size,
                    borderRadius: config.shape === 'circle' ? config.size / 2 : 2,
                    backgroundColor: config.color,
                },
                animatedStyle,
            ]}
        />
    );
}

export function CelebrationAnimation({
    play,
    triggerKey,
    onComplete,
}: CelebrationAnimationProps): React.ReactElement | null {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];

    const trophyScale = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);
    const trophyFloat = useSharedValue(0);

    const particles = useMemo<ParticleConfig[]>(() => {
        return Array.from({ length: NUM_PARTICLES }, (_, i) => {
            const isCircle = Math.random() > 0.5;
            // Particles shoot from bottom-center outward
            const startX = (Math.random() - 0.5) * 40; 
            const targetX = (Math.random() - 0.5) * SCREEN_WIDTH * 1.2;
            const peakY = -SCREEN_HEIGHT * (0.2 + Math.random() * 0.6);

            return {
                startX,
                targetX,
                peakY,
                durationUp: 400 + Math.random() * 400,
                durationDown: 1000 + Math.random() * 800,
                color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
                size: 6 + Math.random() * 10,
                widthMultiplier: isCircle ? 1 : 1.5 + Math.random() * 2,
                delay: Math.random() * 300,
                shape: isCircle ? 'circle' : 'rectangle',
                spinSpeedX: (Math.random() - 0.5) * 8,
                spinSpeedY: (Math.random() - 0.5) * 8,
                spinSpeedZ: (Math.random() - 0.5) * 8,
            };
        });
    }, []);

    useEffect(() => {
        if (play) {
            // Haptics
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            const fadeOutStart = 2500;
            
            overlayOpacity.value = withSequence(
                withTiming(1, { duration: 300 }),
                withDelay(fadeOutStart, withTiming(0, { duration: 400 }, (finished) => {
                    if (finished) {
                        if (onComplete) runOnJS(onComplete)();
                    }
                }))
            );
            
            trophyScale.value = withSequence(
                withSpring(1, { damping: 10, stiffness: 100 }),
                withDelay(fadeOutStart, withTiming(0, { duration: 300 }))
            );

            // Floating trophy animation
            trophyFloat.value = withRepeat(
                withSequence(
                    withTiming(-10, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );
        } else {
            // Reset values
            trophyFloat.value = 0;
            trophyScale.value = 0;
            overlayOpacity.value = 0;
        }
    }, [play, triggerKey, onComplete]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const trophyStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: trophyScale.value },
            { translateY: trophyFloat.value }
        ],
        opacity: overlayOpacity.value,
    }));

    if (!play) return null;

    return (
        <View style={styles.fullScreen} pointerEvents="none">
            <Animated.View style={[styles.backdrop, { opacity: overlayOpacity.value }]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            </Animated.View>
            
            <View style={styles.content}>
                {particles.map((p, i) => (
                    <Particle key={i} config={p} play={play} />
                ))}

                <Animated.View style={trophyStyle}>
                    <Ionicons name="trophy" size={120} color="#FFD700" />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    particle: {
        position: 'absolute',
    },
});
