import { AuthHeader } from '@/components/auth/auth-header';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

type ResetErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function ForgotPasswordScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ResetErrors>({});
  
  const { resetPassword, loading } = useAuth();
  
  const handleReset = async () => {
    const nextErrors: ResetErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!password.trim()) {
      nextErrors.password = 'New password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await resetPassword(email, password);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now log in.',
        [{ text: 'OK', onPress: () => router.push('/(auth)') }]
      );
    } catch (err: unknown) {
      let msg = 'Something went wrong.';
      if (err instanceof Error) {
          msg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
          msg = String((err as { message: unknown }).message);
      }
      Alert.alert('Reset failed', msg);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader />

      <View style={{ width: '100%', marginTop: 20 }}>
        <ThemedText style={{ marginBottom: 20, textAlign: 'center', color: colors.icon }}>
          Enter your email and a new password to reset it directly.
        </ThemedText>

        <TextInput 
          label="Email Address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={errors.email}
        />

        <TextInput 
          label="New Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="***********"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          icon="lock-closed-outline"
          error={errors.password}
        />

        <TextInput 
          label="Re-enter New Password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          placeholder="***********"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          icon="lock-closed-outline"
          error={errors.confirmPassword}
        />
        
        <Button 
          title="Reset Password" 
          onPress={handleReset} 
          isLoading={loading} 
          style={{ marginTop: 24 }}
        />

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => router.push('/(auth)')}>
            <ThemedText type="link" style={[styles.bottomLink, { color: colors.primary }]}>Back to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    alignItems: 'center',
  },
  bottomLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
