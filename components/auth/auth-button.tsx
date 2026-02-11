import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
}

export function AuthButton({ title, isLoading, ...props }: AuthButtonProps): React.ReactElement {
  return (
    <TouchableOpacity activeOpacity={0.8} disabled={isLoading} {...props}>
      <LinearGradient
        colors={['#007AFF', '#0056b3']}
        style={styles.button}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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