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

interface PokeAnimationProps {
    play: boolean;
    targetName?: string;
    onComplete?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 12;

const PARTICLE_COLORS = [
    '#E879F9', '#F0ABFC', '#D946EF', '#A855F7',
    '#C084FC', '#818CF8', '#FB923C', '#FBBF24',
    '#34D399', '#22D3EE', '#F472B6', '#FF6B6B',
];

interface ParticleConfig {
    angle: number;
    distance: number;
    color: string;
    size: number;
    delay: number;
}

function Particle({ config, play }: { config: ParticleConfig; play: boolean }) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (play) {
            const radians = (config.angle * Math.PI) / 180;
            const targetX = Math.cos(radians) * config.distance;
            const targetY = Math.sin(radians) * config.distance;

            scale.value = withDelay(
                config.delay,
                withSequence(
                    withSpring(1.2, { damping: 8, stiffness: 200 }),
                    withDelay(200, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })),
                ),
            );

            opacity.value = withDelay(
                config.delay,
                withSequence(
                    withTiming(1, { duration: 100 }),
                    withDelay(400, withTiming(0, { duration: 300 })),
                ),
            );

            translateX.value = withDelay(
                config.delay,
                withTiming(targetX, { duration: 600, easing: Easing.out(Easing.cubic) }),
            );

            translateY.value = withDelay(
                config.delay,
                withTiming(targetY, { duration: 600, easing: Easing.out(Easing.cubic) }),
            );
        } else {
            translateX.value = 0;
            translateY.value = 0;
            scale.value = 0;
            opacity.value = 0;
        }
    }, [play, config, translateX, translateY, scale, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    width: config.size,
                    height: config.size,
                    borderRadius: config.size / 2,
                    backgroundColor: config.color,
                },
                animatedStyle,
            ]}
        />
    );
}

export const PokeAnimation: React.FC<PokeAnimationProps> = ({
    play,
    targetName,
    onComplete,
}) => {
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
        return Array.from({ length: NUM_PARTICLES }, (_, i) => ({
            angle: (360 / NUM_PARTICLES) * i + (Math.random() * 20 - 10),
            distance: 80 + Math.random() * 60,
            color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
            size: 6 + Math.random() * 8,
            delay: 200 + Math.random() * 150,
        }));
    }, []);

    useEffect(() => {
        if (play) {
            // Overlay fade in
            overlayOpacity.value = withTiming(1, { duration: 200 });

            // Screen flash
            flashOpacity.value = withDelay(
                150,
                withSequence(
                    withTiming(0.3, { duration: 100 }),
                    withTiming(0, { duration: 200 }),
                ),
            );

            // Emoji spring bounce
            emojiScale.value = withDelay(
                100,
                withSequence(
                    withSpring(1.3, { damping: 6, stiffness: 180 }),
                    withDelay(100, withSpring(1, { damping: 12, stiffness: 200 })),
                ),
            );

            // Emoji wiggle
            emojiRotation.value = withDelay(
                300,
                withSequence(
                    withTiming(-15, { duration: 80 }),
                    withTiming(15, { duration: 80 }),
                    withTiming(-10, { duration: 80 }),
                    withTiming(10, { duration: 80 }),
                    withTiming(0, { duration: 80 }),
                ),
            );

            // Text fade in
            textOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
            textTranslateY.value = withDelay(
                400,
                withSpring(0, { damping: 15, stiffness: 200 }),
            );

            // Auto-dismiss
            const fadeOutDelay = 1400;
            overlayOpacity.value = withDelay(
                fadeOutDelay,
                withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }, (finished) => {
                    if (finished && onComplete) {
                        runOnJS(onComplete)();
                    }
                }),
            );

            emojiScale.value = withDelay(
                fadeOutDelay,
                withTiming(0, { duration: 300 }),
            );

            textOpacity.value = withDelay(fadeOutDelay, withTiming(0, { duration: 300 }));
        } else {
            emojiScale.value = 0;
            emojiRotation.value = 0;
            overlayOpacity.value = 0;
            flashOpacity.value = 0;
            textOpacity.value = 0;
            textTranslateY.value = 20;
        }
    }, [play, emojiScale, emojiRotation, overlayOpacity, flashOpacity, textOpacity, textTranslateY, onComplete]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const emojiStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: emojiScale.value },
            { rotate: `${emojiRotation.value}deg` },
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
                {/* Particles */}
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
                        borderColor: colors.collaborativePrimary
                    }
                ]}>
                    <Text style={[styles.pokeText, { color: colors.white }]}>
                        Poked {targetName || 'them'}!
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};

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
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    pokeText: {
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
