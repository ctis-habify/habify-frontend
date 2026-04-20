import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

export interface PokeAnimationProps {
    readonly play: boolean;
    readonly triggerKey?: number; // Used to re-trigger animation even if 'play' is already true
    readonly targetName?: string;
    readonly onComplete?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 80; // Massive full-page explosion

const PARTICLE_COLORS = [
    '#E879F9', '#F0ABFC', '#D946EF', '#A855F7',
    '#C084FC', '#818CF8', '#FB923C', '#FBBF24',
    '#34D399', '#22D3EE', '#F472B6', '#FF6B6B',
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
            // Start from bottom of the screen
            const startY = (SCREEN_HEIGHT / 2) + 50; 
            const endY = startY + 150; // Fall past bottom

            // Set initial position
            translateX.value = config.startX;
            translateY.value = startY;

            const totalDuration = config.durationUp + config.durationDown;

            opacity.value = withDelay(
                config.delay,
                withSequence(
                    withTiming(1, { duration: 50 }),
                    withDelay(totalDuration - 350, withTiming(0, { duration: 300 })),
                ),
            );

            scale.value = withDelay(
                config.delay,
                withSequence(
                    withSpring(1, { damping: 12, stiffness: 220 }),
                    withDelay(totalDuration - 250, withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) })),
                ),
            );

            // X movement (drifting sideways during flight)
            translateX.value = withDelay(
                config.delay,
                withTiming(config.targetX, { duration: totalDuration, easing: Easing.linear })
            );

            // Y movement (shooting up fast, then falling down)
            translateY.value = withDelay(
                config.delay,
                withSequence(
                    withTiming(config.peakY, { duration: config.durationUp, easing: Easing.out(Easing.cubic) }),
                    withTiming(endY, { duration: config.durationDown, easing: Easing.in(Easing.quad) })
                )
            );

            // Intense 3D rotations
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
        } else {
            // Immediate reset
            translateX.value = config.startX;
            translateY.value = (SCREEN_HEIGHT / 2) + 50;
            scale.value = 0;
            opacity.value = 0;
            rotateX.value = 0;
            rotateY.value = 0;
            rotateZ.value = 0;
        }
    }, [play, config, translateX, translateY, scale, opacity, rotateX, rotateY, rotateZ]);

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

    const width = config.size * config.widthMultiplier;
    const height = config.size;

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    width,
                    height,
                    borderRadius: config.shape === 'circle' ? height / 2 : height * 0.15,
                    backgroundColor: config.color,
                },
                animatedStyle,
            ]}
        />
    );
}

export function PokeAnimation({
    play,
    triggerKey,
    targetName,
    onComplete,
}: PokeAnimationProps): React.ReactElement | null {
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const emojiScale = useSharedValue(0);
    const emojiRotation = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);
    const flashOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);

    const particles = useMemo<ParticleConfig[]>(() => {
        return Array.from({ length: NUM_PARTICLES }, (_, i) => {
            const isCircle = Math.random() > 0.4;
            
            // X position calculation (spread completely across the screen width)
            const startX = (Math.random() - 0.5) * SCREEN_WIDTH;
            const driftX = (Math.random() - 0.5) * (SCREEN_WIDTH * 0.4);
            const targetX = startX + driftX;

            // Y position calculation (fountain effect from bottom to varied peak heights)
            const peakY = -SCREEN_HEIGHT * (0.1 + Math.random() * 0.7);

            return {
                startX,
                targetX,
                peakY,
                durationUp: 350 + Math.random() * 300,
                durationDown: 800 + Math.random() * 600,
                color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
                size: 8 + Math.random() * 12,
                widthMultiplier: isCircle ? 1 : 1.2 + Math.random() * 1.8,
                delay: Math.random() * 180, // Micro-delays for organic explosion
                shape: isCircle ? 'circle' : 'rectangle',
                spinSpeedX: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
                spinSpeedY: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
                spinSpeedZ: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3),
            };
        });
    }, []);

    useEffect(() => {
        if (play) {
            // Reset shared values for a fresh start on every poke
            overlayOpacity.value = 0;
            flashOpacity.value = 0;
            emojiScale.value = 0;
            emojiRotation.value = 0;
            textOpacity.value = 0;
            textTranslateY.value = 20;

            // Overlay fade in
            overlayOpacity.value = withTiming(1, { duration: 150 });

            // Screen flash
            flashOpacity.value = withSequence(
                withTiming(0.25, { duration: 80 }),
                withTiming(0, { duration: 150 }),
            );

            // Emoji pop and subtle wiggle
            emojiScale.value = withSequence(
                withSpring(1.4, { damping: 6, stiffness: 240 }),
                withSpring(1, { damping: 10, stiffness: 200 }),
            );

            emojiRotation.value = withSequence(
                withTiming(-12, { duration: 60 }),
                withTiming(12, { duration: 60 }),
                withTiming(0, { duration: 60 }),
            );

            // Text fade in
            textOpacity.value = withDelay(180, withTiming(1, { duration: 200 }));
            textTranslateY.value = withDelay(
                180,
                withSpring(0, { damping: 15, stiffness: 200 }),
            );

            // Extended delay to allow confetti to fully fall
            const fadeOutDelay = 1800; 
            overlayOpacity.value = withDelay(
                fadeOutDelay,
                withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }, (finished) => {
                    if (finished && onComplete) {
                        runOnJS(onComplete)();
                    }
                }),
            );

            emojiScale.value = withDelay(
                fadeOutDelay - 200, // Emoji leaves slightly before overlay completes
                withTiming(0, { duration: 250 }),
            );

            textOpacity.value = withDelay(fadeOutDelay - 200, withTiming(0, { duration: 250 }));
        } else {
            emojiScale.value = 0;
            emojiRotation.value = 0;
            overlayOpacity.value = 0;
            flashOpacity.value = 0;
            textOpacity.value = 0;
            textTranslateY.value = 20;
        }
    }, [play, triggerKey, emojiScale, emojiRotation, overlayOpacity, flashOpacity, textOpacity, textTranslateY, onComplete]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const emojiStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: emojiScale.value },
            { rotateZ: `${emojiRotation.value}deg` },
        ],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    if (!play) return null;

    return (
        <View style={styles.fullScreen} pointerEvents="none">
            {/* Dark overlay */}
            <Animated.View style={[styles.overlay, overlayStyle]} />

            {/* Screen flash */}
            <Animated.View style={[styles.flash, flashStyle, { backgroundColor: colors.collaborativePrimary }]} />

            {/* Center content */}
            <View style={styles.centerContent}>
                {/* Advanced Physics Confetti Particles */}
                {particles.map((p, i) => (
                    <Particle key={i} config={p} play={play} />
                ))}

                {/* Emoji */}
                <Animated.View style={emojiStyle}>
                    <Text style={styles.emoji}>👈</Text>
                </Animated.View>

                {/* Text */}
                <Animated.View style={[
                    styles.textContainer, 
                    textStyle,
                    { 
                        backgroundColor: `${colors.collaborativePrimary}26`, // 15% opacity
                        borderColor: colors.collaborativePrimary,
                        shadowColor: colors.collaborativePrimary
                    }
                ]}>
                    <Text style={[styles.pokeText, { color: colors.white }]}>
                        Poked {targetName || 'them'}!
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    flash: {
        ...StyleSheet.absoluteFillObject,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    particle: {
        position: 'absolute',
    },
    emoji: {
        fontSize: 72,
        textAlign: 'center',
    },
    textContainer: {
        marginTop: 18,
        paddingHorizontal: 26,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    pokeText: {
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.4,

    },
});

