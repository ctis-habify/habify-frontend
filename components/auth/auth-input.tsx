import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function AuthInput({ label, style, error, ...props }: AuthInputProps): React.ReactElement {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  inputError: {
    borderWidth: 1.5,
    borderColor: '#F87171',
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '500',
  },
});
