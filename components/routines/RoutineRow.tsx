import { CircularCheckbox } from '@/components/ui/circular-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type RoutineRowProps = {
  id: string;
  name: string;
  completed?: boolean;
  durationLabel: string;  
  showCamera?: boolean;
  onToggle?: (newValue: boolean) => void;
  onPress?: () => void;
};

export const RoutineRow: React.FC<RoutineRowProps> = ({
  id,
  name,
  completed = false,
  durationLabel,
  showCamera = true,
  onToggle,
  onPress,
}) => {
  const [isChecked, setIsChecked] = useState(completed);

  const toggle = () => {
    const newVal = !isChecked;
    setIsChecked(newVal);
    onToggle?.(newVal);
  };

  const router = useRouter(); // Hook

  const handleCameraPress = () => {
    // Navigate to the modal, passing the routine ID
    router.push({
      pathname: '/(personal)/camera-modal',
      params: { routineId: id }
    });
  }
  
  const parseHours = () => {
    let lower = durationLabel.toLowerCase();

    if (lower.includes('minute')) {
      const min = parseInt(lower);
      return min / 60; // convert to hours
    }
    if (lower.includes('hour')) {
      return parseInt(lower);
    }
    return 0;
  };

  const hours = parseHours();

  const getColor = () => {
    if (hours <= 1) return '#ef4444';    // red
    if (hours <= 7) return '#f97316';    // orange
    return '#16a34a';                    // green
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
    //<View style={styles.row}>
      <CircularCheckbox value={isChecked} onToggle={toggle} />

      <Text style={[styles.name, isChecked && styles.completedText]}>
        {name}
      </Text>

      {/* CAMERA ICON — only if unchecked */}
      {!isChecked && showCamera && (
        <TouchableOpacity onPress={handleCameraPress} style={styles.cameraBtn}>
          <Ionicons name="camera-outline" size={20} color="#1d4ed8" />
        </TouchableOpacity>
      )}

      {/* DURATION BADGE — only if unchecked */}
      {!isChecked && (
        <View style={[styles.badge, { backgroundColor: getColor() }]}>
          <Text style={styles.badgeText}>{durationLabel}</Text>
        </View>
      )}
    //</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  completedText: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  cameraBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});