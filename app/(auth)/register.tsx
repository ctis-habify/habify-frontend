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
import { Alert, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { authService } from '../../services/auth.service';

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
  const [genderOpen, setGenderOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');
  const [isLoading, setIsLoading] = useState(false);

  const AVATARS = [
    { id: 'avatar1', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' },
    { id: 'avatar2', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka' },
    { id: 'avatar3', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob' },
    { id: 'avatar4', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack' },
    { id: 'avatar5', uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly' },
  ];

  const validateForm = () => {
    if (!name || !email || !birthDate || !gender || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return false;
    }
// ... (rest of validateForm logic)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      Alert.alert('Invalid Date', 'Birth date must be in YYYY-MM-DD format.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return false;
    }
    return true;
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
        avatar: selectedAvatar // Send selected avatar ID (or URL if backend supports it directly, but ID is cleaner if mapping locally, though we used URLs above so let's send URI or ID. Let's send ID or URI. Plan said ID, but user wants to see it. Let's send the URI for simplicity if backend blindly accepts string)
        // Actually, backend might not have this column yet. But 'any' payload allows sending it.
        // Assuming backend handles or ignores extra fields.
      };

      const data = await authService.register(payload);
      console.log('User created:', data);
      
      // Persist avatar locally in case backend doesn't support it yet
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
           msg = String((error as any).message);
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
          onChangeText={setName}
          placeholder="Name Surname"
          icon="person-outline"
        />

        <TextInput 
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
        />

        {/* Birth Date Picker */}
        <View style={{ marginBottom: 16 }}>
          <ThemedText type="label" style={[styles.dropdownLabel, { color: colors.icon }]}>Birth Date</ThemedText>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
             <Ionicons name="calendar-outline" size={20} color={colors.icon} style={{ marginRight: 10 }} />
             <Text style={birthDate ? [styles.dateText, { color: colors.text }] : [styles.placeholderText, { color: colors.icon }]}>
               {birthDate || 'YYYY-MM-DD'}
             </Text>
          </TouchableOpacity>

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
                           onChange={(e, d) => {
                              if (d) {
                                setDateObject(d);
                                setBirthDate(d.toISOString().split('T')[0]);
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
                     setShowDatePicker(false);
                     if (d) {
                       setDateObject(d);
                       setBirthDate(d.toISOString().split('T')[0]);
                     }
                  }}
                />
             )
          )}
        </View>

        <View style={{ marginBottom: 16, zIndex: 5000 }}>
          <ThemedText type="label" style={[styles.dropdownLabel, { color: colors.icon }]}>Gender</ThemedText>
          <DropDownPicker
            open={genderOpen}
            value={gender}
            items={GENDER_OPTIONS}
            setOpen={setGenderOpen}
            setValue={setGender}
            placeholder="Select Gender"
            style={[
              styles.dropdown,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            placeholderStyle={[styles.placeholderStyle, { color: colors.icon }]}
            textStyle={[styles.dropdownText, { color: colors.text }]}
            listMode="MODAL"
            theme={theme === 'dark' ? 'DARK' : 'LIGHT'}
          />
        </View>

        <TextInput 
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="***********"
          secureTextEntry
          icon="lock-closed-outline"
        />

        {/* Avatar Selection */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText type="label" style={{ marginBottom: 12, marginLeft: 4, color: colors.icon }}>
            Select Avatar
          </ThemedText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {AVATARS.map((av) => (
              <TouchableOpacity
                key={av.id}
                onPress={() => setSelectedAvatar(av.id)}
                style={{
                  borderWidth: 3,
                  borderColor: selectedAvatar === av.id ? colors.primary : 'transparent',
                  borderRadius: 30, // fully rounded padding
                  padding: 2,
                }}
              >
               <Image 
                 source={{ uri: av.uri }} 
                 style={{
                   width: 45,
                   height: 45,
                   borderRadius: 22.5,
                   backgroundColor: colors.surface,
                 }} 
               />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button 
          title="Sign Up" 
          onPress={handleRegister} 
          isLoading={isLoading} 
          style={{ marginTop: 20 }}
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownLabel: {
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 12,
    borderWidth: 1.5,
    height: 52,
  },
  dropdownContainer: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 12,
  },
  placeholderStyle: {
    color: Colors.light.icon,
    fontSize: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 12,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    width: '90%',
    padding: 20,
    alignItems: 'center',
  },
  pickerHeader: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
});
