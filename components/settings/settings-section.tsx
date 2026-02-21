import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

export interface SettingsSectionProps {
    title?: string;
    children: React.ReactNode;
    delay?: number;
}

export function SettingsSection({ title, children, delay = 0 }: SettingsSectionProps): React.ReactElement {
    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(500).springify()}
            layout={Layout.springify()}
            style={styles.container}
        >
            {title && <Text style={styles.title}>{title}</Text>}
            <Animated.View style={styles.content}>
                {children}
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff', // Assuming dark gradient bg based on Profile page
        marginBottom: 8,
        marginLeft: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    content: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
});
