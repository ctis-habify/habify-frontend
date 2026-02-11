import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
}

export function AuthInput({ label, style, ...props }: AuthInputProps): React.ReactElement {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        {...props}
      />
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
});