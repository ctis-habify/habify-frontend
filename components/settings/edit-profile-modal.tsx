import { AVATARS } from '@/constants/avatars';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { User, UserUpdateDto } from '@/types/user';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

export interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    user: User;
    field: 'name' | 'birthDate' | 'avatar';
    onSave: (data: UserUpdateDto) => Promise<void>;
}

export function EditProfileModal({
  visible,
  onClose,
  user,
  field,
  onSave,
}: EditProfileModalProps): React.ReactElement {
    const [name, setName] = useState(user.name ?? '');
    const [birthDate, setBirthDate] = useState<Date>(
      user.birthDate ? new Date(user.birthDate) : new Date(2000, 0, 1),
    );
    const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || 'avatar1');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';
    const isEditingName = field === 'name';
    const isEditingAvatar = field === 'avatar';
    
    let modalTitle = 'Edit Profile';
    if (field === 'birthDate') modalTitle = 'Edit Birth Date';
    if (field === 'avatar') modalTitle = 'Change Avatar';

    const dateText = useMemo(() => birthDate.toLocaleDateString(), [birthDate]);

    useEffect(() => {
      if (!visible) return;
      setName(user.name ?? '');
      setBirthDate(user.birthDate ? new Date(user.birthDate) : new Date(2000, 0, 1));
      setSelectedAvatar(user.avatar || 'avatar1');
      setShowDatePicker(field === 'birthDate' && Platform.OS === 'ios');
    }, [visible, user.name, user.birthDate, user.avatar, field]);

    const handleSave = async () => {
        if (isEditingName && !name.trim()) return;

        setLoading(true);
        try {
            if (isEditingName) {
              await onSave({ name: name.trim() });
            } else if (isEditingAvatar) {
              await onSave({ avatar: selectedAvatar });
            } else {
              await onSave({ birthDate: birthDate.toISOString().split('T')[0] });
            }
            onClose();
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBirthDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (selectedDate) setBirthDate(selectedDate);
      if (Platform.OS === 'android') setShowDatePicker(false);
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
                        { 
                            backgroundColor: Colors[theme].card,
                            borderColor: Colors[theme].border
                        }
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: Colors[theme].text }]}>{modalTitle}</Text>
                        <TouchableOpacity 
                            onPress={onClose} 
                            style={[
                                styles.closeButton, 
                                { backgroundColor: Colors[theme].surface }
                            ]}
                        >
                            <Ionicons name="close" size={24} color={Colors[theme].text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        {isEditingName && (
                          <>
                            <Text style={[styles.label, { color: Colors[theme].textSecondary }]}>Full Name</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: Colors[theme].surface,
                                        color: Colors[theme].text,
                                        borderColor: Colors[theme].border
                                    }
                                ]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors[theme].textTertiary}
                            />
                          </>
                        )}
                        
                        {field === 'birthDate' && (
                          <>
                            <Text style={[styles.label, { color: Colors[theme].textSecondary }]}>Birth Date</Text>
                            <TouchableOpacity
                              style={[
                                styles.input,
                                styles.dateField,
                                {
                                  backgroundColor: Colors[theme].surface,
                                  borderColor: Colors[theme].border,
                                },
                              ]}
                              onPress={() => setShowDatePicker(true)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.dateText, { color: Colors[theme].text }]}>{dateText}</Text>
                              <Ionicons
                                name="calendar-outline"
                                size={20}
                                color={Colors[theme].icon}
                              />
                            </TouchableOpacity>
                            {showDatePicker && (
                              <DateTimePicker
                                value={birthDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={handleBirthDateChange}
                                themeVariant={isDark ? 'dark' : 'light'}
                              />
                            )}
                          </>
                        )}

                        {isEditingAvatar && (
                          <View style={styles.avatarSection}>
                            <Text style={[styles.label, { color: Colors[theme].textSecondary, marginBottom: 16 }]}>Choose your look</Text>
                            <ScrollView 
                              horizontal 
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.avatarGrid}
                            >
                              {AVATARS.map((avatar) => (
                                <TouchableOpacity
                                  key={avatar.id}
                                  onPress={() => setSelectedAvatar(avatar.id)}
                                  activeOpacity={0.8}
                                  style={[
                                    styles.avatarOption,
                                    { borderColor: Colors[theme].border },
                                    selectedAvatar === avatar.id && { 
                                      borderColor: Colors[theme].primary,
                                      backgroundColor: `${Colors[theme].primary}15`
                                    }
                                  ]}
                                >
                                  <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                                  {selectedAvatar === avatar.id && (
                                    <View style={[styles.checkBadge, { backgroundColor: Colors[theme].primary }]}>
                                      <Ionicons name="checkmark" size={12} color="white" />
                                    </View>
                                  )}
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.saveButton, 
                                { backgroundColor: Colors[theme].primary },
                                loading && styles.disabledButton
                            ]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors[theme].white} />
                            ) : (
                                <Text style={[styles.saveButtonText, { color: Colors[theme].white }]}>Save Changes</Text>
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
        padding: 24,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdropTouch: {
        flex: 1,
    },
    content: {
        width: '100%',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeButton: {
        padding: 6,
        borderRadius: 14,
    },
    form: {
        gap: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: -8,
        marginLeft: 4,
    },
    input: {
        borderRadius: 18,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
    },
    avatarSection: {
      marginVertical: 4,
    },
    avatarGrid: {
      gap: 12,
      paddingHorizontal: 4,
      paddingVertical: 8,
    },
    avatarOption: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3,
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 30,
    },
    checkBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'white',
    },
    saveButton: {
        borderRadius: 18,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

