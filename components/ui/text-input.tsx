import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, TextInputProps, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function TextInput({
  label,
  error,
  icon,
  onIconPress,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: Props): React.ReactElement {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = isFocused ? Colors.light.primary : Colors.light.border;
  const textColor = Colors.light.text;
  const placeholderColor = Colors.light.icon;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="label" style={styles.label}>
          {label}
        </ThemedText>
      )}

      <View style={[styles.inputContainer, { borderColor }, error ? styles.errorBorder : undefined]}>
        {icon && (
          <TouchableOpacity onPress={onIconPress} disabled={!onIconPress}>
            <Ionicons name={icon} size={20} color={isFocused ? Colors.light.primary : Colors.light.icon} style={styles.icon} />
          </TouchableOpacity>
        )}

        <RNTextInput
          style={[styles.input, { color: textColor }, style]}
          placeholderTextColor={placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={Colors.light.icon} style={styles.rightIcon} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    color: Colors.light.icon,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingVertical: 0, // important for android
  },
  icon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  errorBorder: {
    borderColor: Colors.light.error,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
