import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircularCheckbox } from '@/components/ui/circular-checkbox';

export type RoutineRowProps = {
  id: string;
  name: string;
  completed?: boolean;
  durationLabel: string;  
  showCamera?: boolean;
  frequencyType?: string;
  onToggle?: (newValue: boolean) => void;
  onPress?: (id: string) => void; // changed: accept id
  categoryName?: string;
  failed?: boolean;
  streak?: number;
  missedCount?: number;
  startTime?: string; // HH:MM:SS
  endTime?: string;   // HH:MM:SS
  collaborativeKey?: string;
  creatorId?: string;
  isDark?: boolean;
};

// Helpers moved outside
const diffMinutes = (dt2: Date, dt1: Date) => {
  let diff = (dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.ceil(diff);
};

const formatRemaining = (minutes: number) => {
   if (minutes < 0) return 'Failed';
   if (minutes === 0) return '1 Min';
   if (minutes < 60) return `${minutes} Min`;
   const h = Math.floor(minutes / 60);
   return `${h} Hours`;
};

const getHoursFromLabel = (label?: string) => {
  if (!label) return 0;
  let lower = label.toLowerCase();
  if (lower.includes('minute') || lower.includes('min')) {
    const min = parseInt(lower);
    return min / 60;
  }
  if (lower.includes('hour')) {
    return parseInt(lower);
  }
  return 0;
};

const getBadgeColor = (label?: string, hours?: number) => {
  if (!label || hours === undefined) return '#94a3b8';
  if (label.startsWith('Starts')) return '#3b82f6';
  if (hours <= 1) return '#ef4444';
  if (hours <= 7) return '#ff5656';
  if (hours <= 14) return '#f97316';
  if (hours <= 20) return '#16a34a';
  return '#ff93ff';
};

export const RoutineRow = React.memo(({
  id,
  name,
  completed = false,
  durationLabel: initialLabel,
  showCamera = true,
  onPress,
  frequencyType,
  failed = false,
  streak = 0,
  missedCount = 0,
  startTime,
  endTime,
  collaborativeKey,
  isDark = false,
}: RoutineRowProps): React.ReactElement => {
   
  // 1. Hooks & State
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(completed);
  const [displayLabel, setDisplayLabel] = useState(initialLabel);
  const [effectiveFailed, setEffectiveFailed] = useState(failed || initialLabel === 'Failed');

  // 2. Effects (Sync Props)
  React.useEffect(() => {
    setIsChecked(completed);
  }, [completed]);

  // 3. Callbacks
  const handleCameraPress = useCallback(() => {
    router.push({
      pathname: '/(personal)/camera-modal',
      params: { routineId: id }
    });
  }, [router, id]);

  const updateStatus = useCallback(() => {
      // If manually failed prop is true, stick to it
      if (failed) {
          setEffectiveFailed(true);
          return;
      }
      
      // If it is Pending, force displayLabel to Pending and return
      if (initialLabel === 'Pending') {
          setDisplayLabel('Pending');
          setEffectiveFailed(false);
          return;
      }
      
      const now = new Date();
      
      // Calculate Start Time Object
      let startObj = null;
      if (startTime) {
          const [sh, sm] = startTime.split(':').map(Number);
          startObj = new Date();
          startObj.setHours(sh, sm, 0, 0);
      }

      // Calculate End Time Object
      let endObj = null;
      if (endTime) {
          const [eh, em] = endTime.split(':').map(Number);
          endObj = new Date();
          endObj.setHours(eh, em, 0, 0);
      }

      // 1. Check if Upcoming
      if (startObj && now < startObj) {
          const hStr = startObj.getHours().toString().padStart(2, '0');
          const mStr = startObj.getMinutes().toString().padStart(2, '0');
          setDisplayLabel(`Starts ${hStr}:${mStr}`);
          setEffectiveFailed(false);
          return;
      }

      // 2. Check if Ongoing (Passed start, before end)
      if (startObj && endObj && now >= startObj && now <= endObj) {
          const remainingMins = diffMinutes(endObj, now);
          setDisplayLabel(formatRemaining(remainingMins));
          setEffectiveFailed(false);
          return;
      }
      
      // 3. Check if Failed (Passed end)
      if (endObj && now > endObj && !isChecked) {
           setDisplayLabel('Failed');
           setEffectiveFailed(true);
           return;
      }
      
      // Fallback
      if (!startTime || !endTime) {
          setDisplayLabel(initialLabel);
          setEffectiveFailed(failed || initialLabel === 'Failed');
      }
  }, [startTime, endTime, failed, initialLabel, isChecked]);

  // 4. Effects (Interval)
  React.useEffect(() => {
     updateStatus();
     const intervalId = setInterval(updateStatus, 1000);
     return () => clearInterval(intervalId);
  }, [updateStatus]);

  // 5. Derived Computations
  const hours = getHoursFromLabel(displayLabel);
  const badgeColor = getBadgeColor(displayLabel, hours);

  // 6. Render
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(id)}
      activeOpacity={0.7}
    >
      <TouchableOpacity onPress={handleCameraPress}>
        <CircularCheckbox value={isChecked} color={isDark ? '#E879F9' : undefined} />
      </TouchableOpacity>
      
      <Text style={[
          styles.name, 
          isDark && { color: '#fff' },
          isChecked && styles.completedText
      ]} numberOfLines={1}>
        {name}
      </Text>

      {/* COLLABORATIVE BADGE */}
      {!!collaborativeKey && (
         <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(232, 121, 249, 0.15)' : '#e0f2fe', flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
          <Ionicons name="people" size={12} color={isDark ? '#E879F9' : '#0284c7'} />
          <Text style={[styles.badgeText, { color: isDark ? '#E879F9' : '#0284c7' }]}>Group</Text>
        </View>
      )}

      {/* STREAK BADGE */}
      {streak > 0 && (
         <View style={[styles.badge, { backgroundColor: '#fef3c7', flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
          <Ionicons name="flame" size={12} color="#d97706" />
          <Text style={[styles.badgeText, { color: '#d97706' }]}>{streak}</Text>
        </View>
      )}

      {/* MISSED BADGE */}
      {missedCount > 0 && (
        <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.badgeText, { color: '#ef4444' }]}>Missed: {missedCount}</Text>
        </View>
      )}

      {/* DURATION BADGE */}
      {!isChecked && !effectiveFailed && displayLabel !== 'Pending' && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{hours > 24 ? frequencyType : displayLabel }</Text>
        </View>
      )}

      { effectiveFailed && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>Failed</Text>
        </View>
      )}

      {/* CAMERA ICON */}
      {!isChecked && showCamera && !effectiveFailed && !displayLabel.startsWith('Starts') && (
        <TouchableOpacity 
            onPress={handleCameraPress} 
            style={[styles.cameraBtn, isDark && { backgroundColor: 'rgba(232, 121, 249, 0.1)' }]}
        >
          <Ionicons name="camera" size={18} color={isDark ? '#E879F9' : "#3b82f6"} />
        </TouchableOpacity>
      )}
   
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: 'transparent',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937', // Gray-800
    marginLeft: 14,
  },
  completedText: {
    color: '#9ca3af', // Gray-400
    textDecorationLine: 'line-through',
  },
  cameraBtn: {
    padding: 8,
    marginLeft: 8, // Changed from marginRight to marginLeft
    backgroundColor: '#eff6ff', 
    borderRadius: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999, 
    marginLeft: 4, // Reduced margin since it's now internal
    opacity: 0.9,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});