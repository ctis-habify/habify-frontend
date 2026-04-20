import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

interface RoutineHistoryProps {
  routineId: string;
  themeColor: string;
  createdAt?: string;
}

export function RoutineHistory({ routineId, themeColor, createdAt }: RoutineHistoryProps) {
  const { token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<{ date: string; isDone: boolean }[]>([]);

  const last30Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      if (!token || !routineId) return;
      try {
        setIsLoading(true);
        const startDate = last30Days[0];
        const endDate = last30Days[last30Days.length - 1];
        const historyLogs = await routineService.getCalendarLogs(routineId, startDate, endDate, token);
        setLogs(historyLogs);
      } catch (err) {
        console.warn('Failed to load routine history', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [routineId, token, last30Days]);

  const creationDate = createdAt ? new Date(createdAt).toISOString().split('T')[0] : null;

  return (
    <Animated.View 
      entering={FadeInDown.duration(800).delay(100).springify()}
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)', 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: themeColor,
        }
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: themeColor + '15' }]}>
          <Ionicons name="calendar" size={18} color={themeColor} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Last 30 Days</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Consistency Map</Text>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={themeColor} />
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {last30Days.map((dateStr, index) => {
            const isCompleted = logs.some((l) => l.date === dateStr && l.isDone);
            const isBeforeCreation = creationDate ? dateStr < creationDate : false;
            
            let backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#edf2f7';
            let borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e0';
            
            if (isCompleted) {
              backgroundColor = themeColor;
              borderColor = themeColor;
            } else if (!isBeforeCreation) {
              backgroundColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
              borderColor = isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)';
            } else {
              backgroundColor = 'transparent';
              borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0';
            }

            return (
              <Animated.View
                key={dateStr}
                entering={ZoomIn.duration(400).delay(index * 10)}
                style={[
                  styles.daySquare,
                  {
                    backgroundColor,
                    borderColor,
                    opacity: isBeforeCreation ? 0.3 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    {
                      color: isCompleted ? '#ffffff' : colors.text,
                      opacity: isCompleted ? 1 : 0.5,
                    },
                  ]}
                >
                  {new Date(dateStr).getDate()}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: themeColor }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]} />
          <Text style={[styles.legendText, { color: colors.text }]}>Missed</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20, // Restored to 20 for balance
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 0,
    marginBottom: 12,
    // Premium floating look
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Balanced spacing
    gap: 14,
  },
  headerIcon: {
    width: 40, // Elegant larger size
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 11,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  loadingBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7, 
    justifyContent: 'center',
  },
  daySquare: {
    width: 28, // Clearer, larger squares
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 20,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    paddingTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.5,
  },
});
