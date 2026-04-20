import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface Props {
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A reusable Home button that navigates to the Personal Routines page.
 */
export function HomeButton({ color, style }: Props): React.ReactElement {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to the main routines page
    router.push('/(personal)/(drawer)/routines');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, style]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel="Go to home"
      accessibilityRole="button"
    >
      <Ionicons name="home-outline" size={24} color={color || '#fff'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
