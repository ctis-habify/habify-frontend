import { AuthHeader } from '@/components/auth/auth-header';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authService } from '../../services/auth.service';

type RegisterErrors = {
  name?: string;
  email?: string;
  birthDate?: string;
  gender?: string;
  password?: string;
};

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export default function SignupScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Date State
  const [birthDate, setBirthDate] = useState('');
  const [dateObject, setDateObject] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const AVATARS = [
    { id: 'avatar1', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' },
    { id: 'avatar2', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka' },
    { id: 'avatar3', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob' },
    { id: 'avatar4', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack' },
    { id: 'avatar5', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly' },
    { id: 'avatar6', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sophia' },
    { id: 'avatar7', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=George' },
    { id: 'avatar8', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Elena' },
    { id: 'avatar9', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Klaus' },
    { id: 'avatar10', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Zoe' },
    { id: 'avatar11', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Oliver' },
    { id: 'avatar12', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah' },
  ];

  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].uri);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: RegisterErrors = {};

    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    if (!birthDate.trim()) nextErrors.birthDate = 'Birth date is required.';
    if (!gender) nextErrors.gender = 'Gender is required.';
    if (!password.trim()) nextErrors.password = 'Password is required.';

    const emailRegex = /\S+@\S+\.\S+/;
    if (email.trim() && !emailRegex.test(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (birthDate.trim() && !dateRegex.test(birthDate)) {
      nextErrors.birthDate = 'Birth date must be in YYYY-MM-DD format.';
    }
    if (password.trim() && password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const payload = {
        name: name,
        email: email,
        password: password,
        gender: gender.toLowerCase(),
        birthDate: birthDate,
        avatar: selectedAvatar
      };

      await authService.register(payload);

      const safeEmail = email.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_');
      await SecureStore.setItemAsync(`avatar_${safeEmail}`, selectedAvatar);

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);

    } catch (error: unknown) {
      let msg = 'Registration Failed';
      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        msg = String((error as { message: unknown }).message);
      }
      Alert.alert('Registration Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.surface }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <AuthHeader />

      <View style={{ width: '100%', zIndex: 1000 }}>
        <TextInput
          label="Name Surname"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Name Surname"
          icon="person-outline"
          containerStyle={{ marginBottom: 12 }}
          error={errors.name}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          containerStyle={{ marginBottom: 12 }}
          error={errors.email}
        />

        {/* Birth Date Picker */}
        <View style={{ marginBottom: 12 }}>
          <ThemedText type="label" style={[styles.dropdownLabel, { color: colors.icon }]}>Birth Date</ThemedText>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                backgroundColor: colors.surface,
                borderColor: errors.birthDate ? colors.error : colors.border,
              },
            ]}
            onPress={() => {
              setErrors((prev) => ({ ...prev, birthDate: undefined }));
              setShowDatePicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.icon} style={{ marginRight: 10 }} />
            <Text style={birthDate ? [styles.dateText, { color: colors.text }] : [styles.placeholderText, { color: colors.icon }]}>
              {birthDate || 'YYYY-MM-DD'}
            </Text>
          </TouchableOpacity>
          {errors.birthDate ? (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              {errors.birthDate}
            </ThemedText>
          ) : null}

          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                    <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={dateObject}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      textColor={colors.text}
                      themeVariant={theme === 'dark' ? 'dark' : 'light'}
                      onChange={(e, d) => {
                        if (d) {
                          setDateObject(d);
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setBirthDate(`${year}-${month}-${day}`);
                          setErrors((prev) => ({ ...prev, birthDate: undefined }));
                        }
                      }}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={dateObject}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e, d) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (d) {
                    setDateObject(d);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    setBirthDate(`${year}-${month}-${day}`);
                    setErrors((prev) => ({ ...prev, birthDate: undefined }));
                  }
                }}
              />
            )
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <ThemedText type="label" style={[styles.dropdownLabel, { color: colors.icon }]}>Gender</ThemedText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = gender === option.value;
              let iconName: any = 'male';
              let activeColor = colors.primary;

              if (option.value === 'female') {
                iconName = 'female';
                activeColor = '#F472B6'; // Pink for female
              } else if (option.value === 'other') {
                iconName = 'male-female';
                activeColor = '#10B981'; // Emerald for other
              }

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setGender(option.value);
                    setErrors((prev) => ({ ...prev, gender: undefined }));
                  }}
                  style={[
                    styles.segmentedButton,
                    {
                      backgroundColor: isSelected ? activeColor : colors.surface,
                      borderColor: isSelected ? activeColor : colors.border,
                    },
                    errors.gender && !isSelected && { borderColor: colors.error }
                  ]}
                >
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={isSelected ? '#fff' : colors.icon}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[
                    styles.segmentedButtonText,
                    { color: isSelected ? '#fff' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.gender ? (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              {errors.gender}
            </ThemedText>
          ) : null}
        </View>

        <TextInput
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="***********"
          secureTextEntry
          icon="lock-closed-outline"
          containerStyle={{ marginBottom: 12 }}
          error={errors.password}
        />

        {/* Avatar Selection */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText type="label" style={{ marginBottom: 12, marginLeft: 4, color: colors.icon }}>
            Select Avatar
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
          >
            {AVATARS.map((av) => (
              <TouchableOpacity
                key={av.id}
                onPress={() => setSelectedAvatar(av.uri)}
                style={{
                  borderWidth: 3,
                  borderColor: selectedAvatar === av.uri ? colors.primary : 'transparent',
                  borderRadius: 35,
                  padding: 2,
                }}
              >
                <Image
                  source={{ uri: av.uri }}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: colors.surface,
                  }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Button
          title="Sign Up"
          onPress={handleRegister}
          isLoading={isLoading}
          style={{ marginTop: 10 }}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownLabel: {
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1.5,
    height: 52,
  },
  dropdownContainer: {
    borderRadius: 12,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  dropdownText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    borderRadius: 12,
    width: '90%',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  segmentedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerHeader: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});
