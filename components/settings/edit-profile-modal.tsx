import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { User, UserUpdateDto } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

export interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    user: User;
    onSave: (data: UserUpdateDto) => Promise<void>;
}

export function EditProfileModal({ visible, onClose, user, onSave }: EditProfileModalProps): React.ReactElement {
    const [name, setName] = useState(user.name);
    const [loading, setLoading] = useState(false);
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';

    const handleSave = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSave({ name });
            onClose();
        } catch (error) {
            console.error('Failed to update profile', error);
            // TODO: Show error toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Animated.View
                    entering={FadeIn}
                    style={styles.backdrop}
                >
                    <TouchableOpacity style={styles.backdropTouch} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={[
                        styles.content,
                        { backgroundColor: isDark ? '#1E1B4B' : '#FFFFFF' }
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Edit Profile</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>Full Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    color: isDark ? '#fff' : '#000',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                }
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"}
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    backdropTouch: {
        flex: 1,
    },
    content: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        // Borders and shadows
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', // Subtle border
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
        borderRadius: 12,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    input: {
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    saveButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
