import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export const CircularCheckbox = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.wrapper}>
      <View style={[styles.circle, value && styles.filled]}>
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