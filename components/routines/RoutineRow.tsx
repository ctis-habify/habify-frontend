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
  frequencyType?: string;
  // eslint-disable-next-line no-unused-vars
  onToggle?: (newValue: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onPress?: (id: string) => void; // changed: accept id
  categoryName?: string;
  failed?: boolean;
};

export const RoutineRow: React.FC<RoutineRowProps> = ({
  id,
  name,
  completed = false,
  durationLabel,
  showCamera = true,
  onPress,
  frequencyType,
  failed = false,
}) => {
  // eslint-disable-next-line no-unused-vars
  const [isChecked, setIsChecked] = useState(completed);
  const [isFailed] = useState(failed);
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
    if (hours <= 1) return '#ef4444';   // red
    if (hours <= 7) return '#ff5656';   // pink-red
    if (hours <= 14) return '#f97316';  // orange
    if (hours <= 20) return '#16a34a'   // green
    return '#ff93ff';              // soft pink     
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(id)} // changed: pass id
      activeOpacity={0.7}
    >
      <CircularCheckbox value={isChecked}/>
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
      {!isChecked && !isFailed && (
        <View style={[styles.badge, { backgroundColor: getColor() }]}>
          <Text style={styles.badgeText}>{hours > 24 ? frequencyType : durationLabel }</Text>
        </View>
      )}

      { isFailed && (
                <View style={[styles.badge, { backgroundColor: getColor() }]}>
                <Text style={styles.badgeText}>Failed</Text>
              </View>
      )}
   
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