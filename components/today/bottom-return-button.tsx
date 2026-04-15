import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
};

export function BottomReturnButton({ label, onPress }: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const buttonBg = theme === 'dark' ? '#1E1B4B' : '#7C3AED';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: buttonBg },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 18, // Matched from routines.tsx
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Matched
    borderStyle: 'dashed', // Matched
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginHorizontal: 12,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
});
