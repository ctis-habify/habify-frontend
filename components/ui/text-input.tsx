import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, TextInputProps, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { ThemedText } from '../themed-text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onIconPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextInput({
  label,
  error,
  icon,
  onIconPress,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = isFocused ? colors.primary : colors.border;
  const textColor = colors.text;
  const placeholderColor = colors.icon;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText type="label" style={[styles.label, { color: error ? colors.error : colors.icon }]}>
          {label}
        </ThemedText>
      )}

      <View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor: colors.surface },
          error ? { borderColor: colors.error } : undefined,
        ]}
      >
        {icon && (
          <TouchableOpacity onPress={onIconPress} disabled={!onIconPress}>
            <Ionicons name={icon} size={20} color={isFocused ? colors.primary : colors.icon} style={styles.icon} />
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
            <Ionicons name={rightIcon} size={20} color={colors.icon} style={styles.rightIcon} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
