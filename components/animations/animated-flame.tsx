import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    useDerivedValue,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AnimatedFlameProps {
    streak?: number;
    size?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const AnimatedFlame: React.FC<AnimatedFlameProps> = ({ streak = 0, size = 20 }) => {
    // Shared values for flickering
    const flickerValue = useSharedValue(1);
    const glowValue = useSharedValue(0.4);

    useEffect(() => {
        // Continuous flicker animation
        // Speed increases slightly with streak
        const baseDuration = 600;
        const speedBonus = Math.min(streak * 2, 300); // Max 300ms bonus speed
        const duration = baseDuration - speedBonus;

        flickerValue.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(0.95, { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) })
            ),
            -1,
            true
        );

        glowValue.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: duration * 1.5 }),
                withTiming(0.3, { duration: duration * 1.5 })
            ),
            -1,
            true
        );
    }, [streak, flickerValue, glowValue]);

    // Derived style for the flame core
    const flameStyle = useAnimatedStyle(() => {
        const scaleY = flickerValue.value;
        const scaleX = 1 + (scaleY - 1) * 0.5; // Scale X less intensely

        return {
            transform: [
                { scaleY },
                { scaleX },
                { translateY: (size * (1 - scaleY)) / 2 }, // Keep bottom fixed
            ],
        };
    });

    // Flame SVG Path (Cubic Bezier for organic look)
    const flamePath = 
        "M12 2C12 2 10 6 10 9C10 11.5 11.5 13.5 14 13.5C16.5 13.5 18 11.5 18 9C18 6 12 2 12 2Z" + // Core
        " M12 22C12 22 7 18 7 13C7 10 9 7 12 3C15 7 17 10 17 13C17 18 12 22 12 22Z"; // Outer

    // Note: The path above is a simplified concept. Let's use a more standard "flame" shape for accuracy.
    const actualFlamePath = "M11.75 2C11.75 2 9.5 6.5 9.5 10C9.5 13.5 12 16 12 16C12 16 14.5 13.5 14.5 10C14.5 6.5 12.25 2 12.25 2L11.75 2Z M12 22C12 22 5 17 5 11C5 7 8 3 12 1C16 3 19 7 19 11C19 17 12 22 12 22Z";

    return (
        <View style={{ width: size, height: size }}>
            <Animated.View style={[flameStyle, { width: size, height: size }]}>
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Defs>
                        <LinearGradient id="flameGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                            <Stop offset="0" stopColor="#FFD200" />
                            <Stop offset="0.5" stopColor="#F7941D" />
                            <Stop offset="1" stopColor="#ED1C24" />
                        </LinearGradient>
                    </Defs>
                    {/* Outer glow/flicker layer */}
                    <Path
                        d={actualFlamePath}
                        fill="#F97316"
                        opacity={0.3}
                    />
                    {/* Inner core layer */}
                    <Path
                        d="M12 21.5C12 21.5 6 17.5 6 12.5C6 9 8.5 5 12 3C15.5 5 18 9 18 12.5C18 17.5 12 21.5 12 21.5Z"
                        fill="url(#flameGrad)"
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({});
