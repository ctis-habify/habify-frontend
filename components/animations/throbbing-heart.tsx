import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    interpolateColor,
    useDerivedValue,
} from 'react-native-reanimated';

interface ThrobbingHeartProps {
    lives: number;
    size?: number;
}

export const ThrobbingHeart: React.FC<ThrobbingHeartProps> = ({ lives, size = 16 }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        // Subtle throb animation - gets faster as lives decrease (panic effect)
        const duration = lives <= 1 ? 350 : 600;
        
        scale.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration }),
                withTiming(1, { duration })
            ),
            -1, // Infinite
            true // Reverse
        );
    }, [scale, lives]);

    // Color interpolation based on lives (assuming max 3 for this visual logic)
    // We use derived value to handle the color change smoothly
    const animatedColor = useDerivedValue(() => {
        return interpolateColor(
            lives,
            [0, 1, 2, 3],
            ['#666666', '#b30000', '#ff7070', '#ff4d4d']
        );
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const iconColorStyle = useAnimatedStyle(() => {
        return {
            color: animatedColor.value,
        };
    });

    return (
        <Animated.View style={animatedStyle}>
            <AnimatedIonicons
                name="heart"
                size={size}
                style={iconColorStyle}
            />
        </Animated.View>
    );
};

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

const styles = StyleSheet.create({
    // Add any necessary styles
});
