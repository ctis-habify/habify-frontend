import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface BrokenHeartAnimationProps {
    size?: number;
    color?: string;
    onAnimationComplete?: () => void;
    play?: boolean;
}

export const BrokenHeartAnimation: React.FC<BrokenHeartAnimationProps> = ({
    size = 100,
    color = '#ef4444', // Default red color
    onAnimationComplete,
    play = false,
}) => {
    // Animation values
    const scale = useSharedValue(1);
    const leftHalfRotate = useSharedValue(0);
    const rightHalfRotate = useSharedValue(0);
    const leftHalfX = useSharedValue(0);
    const rightHalfX = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (play) {
            // 1. Initial Heartbeat pump
            scale.value = withSequence(
                withTiming(1.1, { duration: 150, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) }),
                withTiming(1.1, { duration: 150, easing: Easing.out(Easing.ease) }),
                withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) })
            );

            // 2. Crack and Split
            leftHalfRotate.value = withDelay(
                700,
                withTiming(-15, { duration: 400, easing: Easing.bounce })
            );
            rightHalfRotate.value = withDelay(
                700,
                withTiming(15, { duration: 400, easing: Easing.bounce })
            );

            leftHalfX.value = withDelay(
                700,
                withTiming(-10, { duration: 400, easing: Easing.out(Easing.ease) })
            );
            rightHalfX.value = withDelay(
                700,
                withTiming(10, { duration: 400, easing: Easing.out(Easing.ease) })
            );

            // 3. Fade out
            opacity.value = withDelay(
                1500,
                withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
                    if (finished && onAnimationComplete) {
                        runOnJS(onAnimationComplete)();
                    }
                })
            );
        } else {
            // Reset values if play is false
            scale.value = 1;
            leftHalfRotate.value = 0;
            rightHalfRotate.value = 0;
            leftHalfX.value = 0;
            rightHalfX.value = 0;
            opacity.value = 1;
        }
    }, [play, leftHalfRotate, leftHalfX, onAnimationComplete, opacity, rightHalfRotate, rightHalfX, scale]);

    const containerStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
            alignItems: 'center',
            justifyContent: 'center',
        };
    });

    const leftHalfStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: leftHalfX.value },
                { rotateZ: `${leftHalfRotate.value}deg` },
            ],
        };
    });

    const rightHalfStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: rightHalfX.value },
                { rotateZ: `${rightHalfRotate.value}deg` },
            ],
        };
    });

    // Broken heart SVG paths
    // Using two distinct halves that form a heart when put together
    // The right side requires a custom jagged path down the middle to look like a crack
    // For simplicity but still looking good, we mirror the left side but add a jagged edge down the center
    const leftHeartCracked = "M 12 21.35 L 10.55 20.03 C 5.4 15.36 2 12.28 2 8.5 C 2 5.42 4.42 3 7.5 3 C 9.24 3 10.91 3.81 12 5.09 L 11 9 L 13 12 L 10.5 16 L 12 21.35 Z";
    const rightHeartCracked = "M 12 21.35 L 10.5 16 L 13 12 L 11 9 L 12 5.09 C 13.09 3.81 14.76 3 16.5 3 C 19.58 3 22 5.42 22 8.5 C 22 12.28 18.6 15.36 13.45 20.03 L 12 21.35 Z";

    return (
        <Animated.View style={[styles.container, containerStyle, { width: size, height: size }]}>
            <View style={styles.svgContainer}>
                <Animated.View style={[styles.halfContainer, leftHalfStyle]}>
                    <Svg height={size} width={size} viewBox="0 0 24 24">
                        <Path d={leftHeartCracked} fill={color} />
                    </Svg>
                </Animated.View>
                <Animated.View style={[styles.halfContainer, styles.rightHalfContainer, rightHalfStyle]}>
                    <Svg height={size} width={size} viewBox="0 0 24 24">
                        <Path d={rightHeartCracked} fill={color} />
                    </Svg>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    svgContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    halfContainer: {
        position: 'absolute',
        transformOrigin: 'bottom center',
    },
    rightHalfContainer: {
        // Offset slightly if needed to perfectly align visually when uncracked
    }
});
