import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CannotDeleteListModalProps {
    visible: boolean;
    onClose: () => void;
}

export function CannotDeleteListModal({
    visible,
    onClose,
}: CannotDeleteListModalProps): React.ReactElement {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable onPress={() => { }}>
                    <Animated.View
                        entering={FadeInDown.springify().damping(18)}
                        exiting={FadeOutDown.duration(200)}
                        style={styles.modalContainer}
                    >
                        <LinearGradient
                            colors={isDark ? ['#1e1b4b', '#2d1b4e', '#1e1b4b'] : ['#fff', '#fef2f2', '#fee2e2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.card, { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fecaca' }]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.1)' }]}>
                                <Ionicons name="warning-outline" size={40} color={isDark ? '#fb923c' : '#f97316'} />
                            </View>

                            <Text style={[styles.title, { color: isDark ? colors.white : '#1e293b' }]}>Cannot Delete</Text>

                            <Text style={[styles.message, { color: isDark ? 'rgba(255,255,255,0.9)' : '#475569' }]}>
                                This list contains routines. Please delete or move them first.
                            </Text>

                            <TouchableOpacity
                                style={[styles.okBtn, { backgroundColor: isDark ? colors.primary : '#4f46e5' }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.okBtnText, { color: colors.white }]}>OK</Text>
                            </TouchableOpacity>

                        </LinearGradient>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 320,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 10,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        fontWeight: '500',
    },
    okBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    okBtnText: {
        fontSize: 16,
        fontWeight: '800',
    },
});
