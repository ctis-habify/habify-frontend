import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export const CircularCheckbox = ({ value, color }: { value: boolean, color?: string }): React.ReactElement => {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const activeColor = color || colors.primary;

  return (
    <TouchableOpacity style={styles.wrapper}>
      <View style={[
        styles.circle, 
        { borderColor: activeColor }, 
        value && { backgroundColor: activeColor }
      ]}>
        {value && <Ionicons name="checkmark" size={15} color={colors.white} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginRight: 10 },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});