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
import { BrokenHeartAnimation } from '../animations/broken-heart-animation';

interface LeaveRoutineModalProps {
    visible: boolean;
    routineName: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
    onAnimationFinished?: () => void;
}

export function LeaveRoutineModal({
    visible,
    routineName,
    onClose,
    onConfirm,
    isLoading,
    onAnimationFinished,
}: LeaveRoutineModalProps): React.ReactElement {
    const [playAnimation, setPlayAnimation] = useState(false);

    // We handle the confirm locally to trigger the animation
    // then wait for the animation to finish before calling the parent's onConfirm
    const handleConfirm = async () => {
        // Start animation
        setPlayAnimation(true);

        // We execute the actual confirm logic simultaneously or right after
        // The parent's onConfirm should handle the API call
        try {
            await onConfirm();
        } catch (_) {
            // If API fails, stop animation
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
                            colors={['#3b1a83', '#2e1065', '#200f4a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.card}
                        >
                            {playAnimation ? (
                                <View style={styles.animationContainer}>
                                    <BrokenHeartAnimation
                                        play={playAnimation}
                                        size={120}
                                        onAnimationComplete={handleAnimationComplete}
                                    />
                                    <Text style={styles.leavingText}>Leaving...</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="exit-outline" size={36} color="#ef4444" />
                                    </View>

                                    <Text style={styles.title}>Leave Routine</Text>

                                    <Text style={styles.message}>
                                        Are you sure you want to leave <Text style={styles.highlight}>{routineName || 'this routine'}</Text>?
                                    </Text>
                                    <Text style={styles.subtext}>
                                        You will lose access to the group chat and your streak will be reset.
                                    </Text>

                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={styles.cancelBtn}
                                            onPress={onClose}
                                            disabled={isLoading}
                                        >
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.leaveBtn}
                                            onPress={handleConfirm}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="#ffffff" size="small" />
                                            ) : (
                                                <Text style={styles.leaveBtnText}>Leave Routine</Text>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        borderWidth: 1,
        borderColor: 'rgba(232, 121, 249, 0.2)', // Collaborative Primary subtle
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        minHeight: 280,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 22,
    },
    highlight: {
        color: '#E879F9', // Collaborative Primary
        fontWeight: '700',
    },
    subtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 18,
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    leaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#ef4444', // Red-500
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    leaveBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    animationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    leavingText: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#ef4444',
    }
});
