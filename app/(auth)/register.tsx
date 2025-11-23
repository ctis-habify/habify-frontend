import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function SignupScreen() {
  // 1. STATE
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState(''); 
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  
  // API URL (iOS Simulator)
  const API_URL = 'http://localhost:3000'; 
  const [isLoading, setIsLoading] = useState(false);

  // 2. VALIDATION (Frontend Only)
  const validateForm = () => {
    // 1. Check if fields are empty
    if (!name || !email || !birthDate || !gender || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return false;
    }

    // 2. Check Email Format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address (e.g., user@example.com).');
      return false;
    }

    // 3. Check Birth Date Format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      Alert.alert('Invalid Date', 'Birth date must be in YYYY-MM-DD format (e.g. 2002-05-10).');
      return false;
    }

    // 4. Check Password Length
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return false;
    }

    return true;
  };

  // --- API INTEGRATION ---
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 3. Prepare Payload
      const payload = {
        name: name,
        email: email,
        password: password,
        gender: gender.toLowerCase(), 
        birthDate: birthDate          
      };

      // 4. Send Request to Backend
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // 5. Handle Response
      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!');
        console.log('User created:', data);
      } else {
        const message = Array.isArray(data.message) 
          ? data.message[0] 
          : data.message;
        Alert.alert('Registration Failed', message || 'Something went wrong');
      }

    } catch (error) {
      console.error('API Error:', error);
      Alert.alert('Connection Error', 'Could not connect to the backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // MAIN BACKGROUND GRADIENT
    <LinearGradient 
      colors={['#375F9F', '#162451']} 
      style={styles.background}
    >
      <StatusBar style="light" />
      
      <SafeAreaView style={styles.safeArea}>
        
        {/* CARD GRADIENT */}
        <LinearGradient 
          colors={['#1D3275', '#010D4C']} 
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/images/habify-logo.png')} 
              style={styles.icon} 
              resizeMode="contain" 
            />
            <Text style={styles.appName}>Habify</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name Surname</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name Surname"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="example@gmail.com"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>

            {/* Birth Date Input (Formerly Age) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birth Date</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                keyboardType="numbers-and-punctuation" 
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>

            {/* Gender Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                value={gender}
                onChangeText={setGender}
                placeholder="Gender"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true} 
                placeholder="***********"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#007AFF', '#0056b3']}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    borderRadius: 40,
    paddingVertical: 40,
    paddingHorizontal: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  icon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#E0E0E0',
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(30, 42, 94, 0.6)', 
    color: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});