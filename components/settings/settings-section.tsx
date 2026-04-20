import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

export interface SettingsSectionProps {
    title?: string;
    children: React.ReactNode;
    delay?: number;
}

export function SettingsSection({ title, children, delay = 0 }: SettingsSectionProps): React.ReactElement {
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(500).springify()}
            layout={Layout.springify()}
            style={styles.container}
        >
            {title && (
                <Text style={[styles.title, { color: Colors[theme].textSecondary }]}>
                    {title}
                </Text>
            )}
            <Animated.View style={[
                styles.content,
                {
                    backgroundColor: Colors[theme].card,
                    borderColor: Colors[theme].border
                }
            ]}>
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
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
});
