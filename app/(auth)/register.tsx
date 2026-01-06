import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { authService } from '../../services/auth.service';

export default function SignupScreen() {
  const router = useRouter(); 

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState(''); 
  const [gender, setGender] = useState('');
  const [genderOpen, setGenderOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        birthDate: birthDate
      };

      const data = await authService.register(payload);
      console.log('User created:', data);
      Alert.alert('Success', 'Account created successfully!', [
         { text: 'OK', onPress: () => router.replace('/') }
      ]);

    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
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

        <TextInput 
          label="Birth Date"
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          icon="calendar-outline"
        />

        <View style={{ marginBottom: 16, zIndex: 5000 }}>
          <ThemedText type="label" style={styles.dropdownLabel}>Gender</ThemedText>
          <DropDownPicker
            open={genderOpen}
            value={gender}
            items={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
            ]}
            setOpen={setGenderOpen}
            setValue={setGender}
            placeholder="Select Gender"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            placeholderStyle={styles.placeholderStyle}
            textStyle={styles.dropdownText}
            listMode="SCROLLVIEW"
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
    color: Colors.light.icon,
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
});