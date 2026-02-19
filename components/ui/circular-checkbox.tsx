import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export const CircularCheckbox = ({ value, color = '#2563eb' }: { value: boolean, color?: string }): React.ReactElement => {
  return (
    <TouchableOpacity style={styles.wrapper}>
      <View style={[styles.circle, { borderColor: color }, value && { backgroundColor: color }]}>
        {value && <Ionicons name="checkmark" size={15} color="#fff" />}
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
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: '#2563eb',
  },
});