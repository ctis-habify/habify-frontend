import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type SettingsItemType = 'link' | 'toggle' | 'info' | 'action';

export interface SettingsItemProps {
    icon?: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | boolean;
    type?: SettingsItemType;
    onPress?: () => void;
    onToggle?: (value: boolean) => void;
    color?: string;
    destructive?: boolean;
}

export function SettingsItem({
    icon,
    label,
    value,
    type = 'link',
    onPress,
    onToggle,
    color,
    destructive = false,
}: SettingsItemProps): React.ReactElement {
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const textColor = destructive ? Colors[theme].error : (color || Colors[theme].text);
    const iconColor = destructive ? Colors[theme].error : (color || Colors[theme].primary);

    const renderRightContent = () => {
        switch (type) {
            case 'toggle':
                return (
                    <Switch
                        value={value as boolean}
                        onValueChange={onToggle}
                        trackColor={{ false: Colors[theme].border, true: Colors[theme].primary }}
                        thumbColor={isDark ? '#fff' : '#f4f4f4'}
                        ios_backgroundColor={Colors[theme].border}
                    />
                );
            case 'info':
                return (
                    <Text style={[styles.valueText, { color: Colors[theme].textSecondary }]}>
                        {value as string}
                    </Text>
                );
            case 'link':
            default:
                return (
                    <View style={styles.rightContainer}>
                        {value ? (
                            <Text style={[styles.valueText, { color: Colors[theme].textSecondary }]}>
                                {value as string}
                            </Text>
                        ) : null}
                        <Ionicons name="chevron-forward" size={18} color={Colors[theme].icon} />
                    </View>
                );
        }
    };

    const content = (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {icon && (
                    <View style={[
                        styles.iconContainer, 
                        { backgroundColor: destructive ? 'rgba(239, 68, 68, 0.1)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)') }
                    ]}>
                        <Ionicons name={icon} size={18} color={iconColor} />
                    </View>
                )}
                <Text style={[styles.label, { color: textColor }]}>{label}</Text>
            </View>
            {renderRightContent()}
        </View>
    );

    if (type === 'toggle' || type === 'info') {
        return <View style={[styles.wrapper, { borderBottomColor: Colors[theme].border }]}>{content}</View>;
    }

    return (
        <Animated.View style={[styles.wrapper, animatedStyle, { borderBottomColor: Colors[theme].border }]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.7}
            >
                {content}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    valueText: {
        fontSize: 14,
        marginRight: 8,
    },
});
