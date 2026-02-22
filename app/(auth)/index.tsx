import { AuthHeader } from '@/components/auth/auth-header';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    try {
      await login(email, password, remember);
      router.push('/(personal)/(drawer)/routines');
    } catch (error: unknown) {
      let msg = 'Something went wrong.';
      if (error instanceof Error) {
          msg = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
          msg = String((error as any).message);
      }
      Alert.alert('Login failed', msg);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader />

      <View style={{ width: '100%' }}>
        <TextInput 
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="example@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
        />

        <TextInput 
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="***********"
          secureTextEntry
          icon="lock-closed-outline"
        />
        
        <View style={styles.rowBetween}>
          <View style={styles.rememberRow}>
            <Checkbox
              value={remember}
              onValueChange={setRemember}
              color={remember ? colors.primary : undefined}
              style={[styles.checkbox, { borderColor: colors.border }]}
            />
            <ThemedText style={[styles.rememberText, { color: colors.icon }]}>Remember me</ThemedText>
          </View>
          <TouchableOpacity>
            <ThemedText style={[styles.forgotText, { color: colors.primary }]}>Forgot?</ThemedText>
          </TouchableOpacity>
        </View>

        <Button 
          title="Log In" 
          onPress={handleLogin} 
          isLoading={loading} 
          style={{ marginTop: 24 }}
        />

        <View style={styles.bottomRow}>
          <ThemedText style={[styles.bottomText, { color: colors.icon }]}>Don't have an account? </ThemedText>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <ThemedText type="link" style={[styles.bottomLink, { color: colors.primary }]}>Register</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
    borderColor: Colors.light.border,
  },
  rememberText: {
    fontSize: 14,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
  },
  bottomLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
