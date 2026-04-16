import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
};

export function BottomReturnButton({ label, onPress }: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { 
          backgroundColor: isDark ? colors.surface : colors.primary,
          borderColor: isDark ? colors.border : 'rgba(255,255,255,0.3)',
        },
        pressed && { opacity: 0.8, transform: [{ scale: 0.985 }] },
      ]}
    >
      <Text style={[styles.text, { color: colors.white }]}>{label}</Text>
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
    // position: 'absolute',
    // left: 24,
    // right: 24,
    // bottom: 24,
    // height: 58,
    // borderRadius: 20,
    // borderWidth: 1.5,
    // borderStyle: 'dashed',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
