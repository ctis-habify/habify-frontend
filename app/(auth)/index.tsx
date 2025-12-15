'use client';

import { useAuth } from '@/hooks/useAuth';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  
  // Auth Hook
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    try {
      await login(email, password);
      router.push('/(personal)/routines');
    } catch (error: any) {
      Alert.alert('Login failed', error.message || 'Something went wrong.');
    }
  };

  return (
    <LinearGradient 
      colors={['#375F9F', '#162451']} 
      style={styles.background}
    >
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        
        {/* CARD GRADIENT (Matches Signup) */}
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
            
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="***********"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                secureTextEntry
              />
            </View>

            {/* Remember & Forgot Row */}
            <View style={styles.rowBetween}>
              <View style={styles.rememberRow}>
                <Checkbox
                  value={remember}
                  onValueChange={setRemember}
                  color={remember ? '#007AFF' : '#ffffff'}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button (Matches Signup Gradient) */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#007AFF', '#0056b3']}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.bottomLink}>Register</Text>
              </TouchableOpacity>
            </View>

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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    borderRadius: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  rememberText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  forgotText: {
    color: '#60a5fa', 
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    marginTop: 10,
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  bottomText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  bottomLink: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: 'bold',
  },
});