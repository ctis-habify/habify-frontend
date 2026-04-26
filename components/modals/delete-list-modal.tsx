import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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
import { BrokenHeartAnimation } from '../animations/broken-heart-animation';

interface DeleteListModalProps {
    visible: boolean;
    listTitle: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
    onAnimationFinished?: () => void;
}

export function DeleteListModal({
    visible,
    listTitle,
    onClose,
    onConfirm,
    isLoading,
    onAnimationFinished,
}: DeleteListModalProps): React.ReactElement {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const [playAnimation, setPlayAnimation] = useState(false);

    const handleConfirm = async () => {
        setPlayAnimation(true);
        try {
            await onConfirm();
        } catch (_) {
            setPlayAnimation(false);
        }
    };

    const handleAnimationComplete = () => {
        setPlayAnimation(false);
        onClose();
        if (onAnimationFinished) {
            onAnimationFinished();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={!isLoading ? onClose : undefined}
        >
            <Pressable style={styles.overlay} onPress={!isLoading ? onClose : undefined}>
                <Pressable onPress={() => { }}>
                    <Animated.View
                        entering={FadeInDown.springify().damping(18)}
                        exiting={FadeOutDown.duration(200)}
                        style={styles.modalContainer}
                    >
                        <LinearGradient
                            colors={isDark ? ['#1e1b4b', '#312e81', '#1e1b4b'] : ['#ef4444', '#dc2626', '#b91c1c']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.card, { borderColor: colors.border }]}
                        >
                            {playAnimation ? (
                                <View style={styles.animationContainer}>
                                    <BrokenHeartAnimation
                                        play={playAnimation}
                                        size={120}
                                        onAnimationComplete={handleAnimationComplete}
                                    />
                                    <Text style={[styles.deletingText, { color: colors.white }]}>Deleting...</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                                        <Ionicons name="trash-outline" size={36} color={colors.white} />
                                    </View>

                                    <Text style={[styles.title, { color: colors.white }]}>Delete List</Text>

                                    <Text style={[styles.message, { color: 'rgba(255,255,255,0.9)' }]}>
                                        Are you sure you want to delete <Text style={[styles.highlight, { color: isDark ? '#f87171' : '#fff' }]}>{listTitle || 'this list'}</Text>?
                                    </Text>
                                    <Text style={[styles.subtext, { color: 'rgba(255,255,255,0.7)' }]}>
                                        This action will permanently remove this empty list.
                                    </Text>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={[styles.cancelBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }]}
                                            onPress={onClose}
                                            disabled={isLoading}
                                        >
                                            <Text style={[styles.cancelBtnText, { color: colors.white }]}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.deleteBtn, { backgroundColor: colors.white }]}
                                            onPress={handleConfirm}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color={colors.error} size="small" />
                                            ) : (
                                                <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
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
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 24,
        fontWeight: '500',
    },
    highlight: {
        fontWeight: '800',
    },
    subtext: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
        fontWeight: '400',
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '700',
    },
    deleteBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    deleteBtnText: {
        fontSize: 16,
        fontWeight: '800',
    },
    animationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    deletingText: {
        marginTop: 24,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    }
});
