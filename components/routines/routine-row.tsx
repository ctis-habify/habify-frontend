import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CircularCheckbox } from '@/components/ui/circular-checkbox';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const lower = label.toLowerCase();
  if (lower.includes('minute') || lower.includes('min')) {
    const min = parseInt(lower);
    return min / 60;
  }
  if (lower.includes('hour')) {
    return parseInt(lower);
  }
  return 0;
};

const getBadgeColor = (label?: string, hours?: number, colors: any) => {
  if (!label || hours === undefined) return colors.textTertiary;
  if (label.startsWith('Starts')) return colors.primary;
  if (hours <= 1) return colors.error;
  if (hours <= 7) return '#ff5656'; // Semi-critical, keep distinct
  if (hours <= 14) return colors.warning;
  if (hours <= 20) return colors.success;
  return colors.tint;
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
}: RoutineRowProps): React.ReactElement => {
   
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
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
  const badgeColor = getBadgeColor(displayLabel, hours, colors);

  // 6. Render
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress?.(id)}
      activeOpacity={0.7}
    >
      <TouchableOpacity onPress={handleCameraPress}>
        <CircularCheckbox value={isChecked} color={isDark ? colors.tint : undefined} />
      </TouchableOpacity>
      
      <Text style={[
          styles.name, 
          { color: colors.text },
          isChecked && [styles.completedText, { color: colors.textSecondary }]
      ]} numberOfLines={1}>
        {name}
      </Text>

      {/* COLLABORATIVE BADGE */}
      {!!collaborativeKey && (
         <View style={[
           styles.badge, 
           { 
             backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.06)',
             flexDirection: 'row', 
             alignItems: 'center', 
             gap: 4 
           }
         ]}>
          <Ionicons name="people" size={12} color={isDark ? '#c084fc' : '#7c3aed'} />
          <Text style={[styles.badgeText, { color: isDark ? '#c084fc' : '#7c3aed' }]}>Group</Text>
        </View>
      )}

      {/* STREAK BADGE */}
      {streak > 0 && (
         <View style={[
           styles.badge, 
           { 
             backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.06)',
             flexDirection: 'row', 
             alignItems: 'center', 
             gap: 4 
           }
         ]}>
          <Ionicons name="flame" size={12} color={isDark ? '#fbbf24' : '#d97706'} />
          <Text style={[styles.badgeText, { color: isDark ? '#fbbf24' : '#d97706' }]}>{streak}</Text>
        </View>
      )}

      {/* MISSED BADGE */}
      {missedCount > 0 && (
        <View style={[
          styles.badge, 
          { 
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.06)' 
          }
        ]}>
          <Text style={[styles.badgeText, { color: isDark ? '#f87171' : '#dc2626' }]}>Missed: {missedCount}</Text>
        </View>
      )}

      {/* DURATION BADGE */}
      {!isChecked && !effectiveFailed && displayLabel !== 'Pending' && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>{hours > 24 ? frequencyType : displayLabel }</Text>
        </View>
      )}

      { effectiveFailed && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>Failed</Text>
        </View>
      )}

      {/* CAMERA ICON */}
      {!isChecked && showCamera && !effectiveFailed && !displayLabel.startsWith('Starts') && (
        <TouchableOpacity 
            onPress={handleCameraPress} 
            style={[styles.cameraBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
        >
          <Ionicons name="camera" size={18} color={isDark ? colors.white : colors.primary} />
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
    fontWeight: '600',
    marginLeft: 14,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  cameraBtn: {
    padding: 8,
    marginLeft: 8, 
    borderRadius: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999, 
    marginLeft: 4, 
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});