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

interface EliminationModalProps {
    visible: boolean;
    routines: string[];
    onClose: () => void;
}

export function EliminationModal({
    visible,
    routines,
    onClose,
}: EliminationModalProps): React.ReactElement {
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
                            colors={isDark ? ['#3f1d38', '#20162b', '#1e1b4b'] : ['#fce7f3', '#fbcfe8', '#fecdd3']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.card, { borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fca5a5' }]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(244, 63, 94, 0.15)' }]}>
                                <Ionicons name="heart-dislike" size={36} color={isDark ? '#ef4444' : '#e11d48'} />
                            </View>

                            <Text style={[styles.title, { color: isDark ? colors.white : '#1e293b' }]}>Eliminated!</Text>

                            <Text style={[styles.message, { color: isDark ? 'rgba(255,255,255,0.9)' : '#334155' }]}>
                                You have been removed from the following routines because you ran out of lives:
                            </Text>

                            <View style={styles.routinesContainer}>
                                {routines.map((r, i) => (
                                    <View key={i} style={styles.routineRow}>
                                        <Ionicons name="ellipse" size={6} color={isDark ? '#f87171' : '#e11d48'} />
                                        <Text style={[styles.routineText, { color: isDark ? '#fca5a5' : '#be123c' }]}>{r}</Text>
                                    </View>
                                ))}
                            </View>

                            <Text style={[styles.subtext, { color: isDark ? 'rgba(255,255,255,0.7)' : '#64748b' }]}>
                                Don't give up! Join new groups to restart your growth. 🚀
                            </Text>

                            <TouchableOpacity
                                style={[styles.okBtn, { backgroundColor: isDark ? colors.error : '#e11d48' }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.okBtnText, { color: colors.white }]}>Got it</Text>
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
        maxWidth: 340,
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
        minHeight: 280,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    routinesContainer: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    routineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    routineText: {
        fontSize: 15,
        fontWeight: '700',
    },
    subtext: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
        fontWeight: '400',
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
