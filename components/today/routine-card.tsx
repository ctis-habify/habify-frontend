import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Routine } from '../../types/routine';

function remainingColor(mins: number) {
  if (mins <= 30) return '#EF4444'; // Red-500
  if (mins <= 60) return '#F97316'; // Orange-500
  if (mins <= 240) return '#EAB308'; // Yellow-500
  return '#10B981'; // Green-500
}

type Props = {
  routine: Routine;
  onPress: () => void;
  onPressCamera?: (_id: string) => void;
};

// "YYYY-MM-DD" + "HH:mm[:ss]" -> Date


export function RoutineCard({ routine, onPress, onPressCamera }: Props): React.ReactElement {
  const { title, endTime, remainingLabel } = routine;

  // Live update state
  const [label, setLabel] = React.useState(remainingLabel === 'Pending' ? 'Pending' : '');
  const [minsLeft, setMinsLeft] = React.useState(0);

  const updateState = React.useCallback(() => {
     if (remainingLabel === 'Pending') {
        setLabel('Pending');
        return;
     }

     if (!endTime) {
        setLabel('Pending');
        setMinsLeft(100);
        return;
     }

     const now = new Date();
     // Parse end time
     const [eh, em] = endTime.split(':').map(Number);
     const end = new Date();
     end.setHours(eh, em, 0, 0);

     const diffMs = end.getTime() - now.getTime();
     if (diffMs < 0) {
        setLabel('Failed');
        setMinsLeft(-1);
        return;
     }

     const diffMins = Math.ceil(diffMs / 60000);
     setMinsLeft(diffMins);

     if (diffMins < 60) {
        setLabel(`${diffMins}m left`);
     } else {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        setLabel(`${h}h ${m}m left`);
     }
  }, [endTime, remainingLabel]);

  React.useEffect(() => {
     updateState();
     const id = setInterval(updateState, 1000);
     return () => clearInterval(id);
  }, [updateState]);


  
  const color = useMemo(() => remainingColor(minsLeft), [minsLeft]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.contentRow}>
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          
          {label !== 'Pending' && (
            <View style={styles.timeBadge}>
               <Ionicons name="time-outline" size={14} color={color} style={{ marginRight: 4 }} />
               <Text style={[styles.duration, { color }]}>{label}</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => onPressCamera?.(routine.id)}
          style={styles.cameraBtn}
          hitSlop={10}
        >
          <Ionicons name="camera" size={20} color={Colors.light.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    
    // Premium Soft Shadow
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }]
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: { 
    flex: 1, 
    paddingRight: 12 
  },
  name: {
    color: '#1e293b', // Slate-800
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  duration: { 
    fontSize: 13, 
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f1f5f9', // Slate-100
    alignItems: 'center',
    justifyContent: 'center',
  },
});
