import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

interface RoutineHistoryProps {
  routineId: string;
  themeColor: string;
  createdAt?: string; // Expecting YYYY-MM-DD or ISO string
  endTime?: string;
}

const WEEKDAYS = ['M', '', 'W', '', 'F', '', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function RoutineHistory({ routineId, themeColor, createdAt, endTime }: RoutineHistoryProps) {
  const { token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<{ date: string; isDone: boolean }[]>([]);
  
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const startPoint = useMemo(() => {
    const now = new Date(today);
    
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        // Sanity Check: If date is before 2026, it's likely a backend default/bug
        if (d.getFullYear() < 2026) {
           // Fallback for old routines with buggy dates: show last 60 days
           const oldFallback = new Date(today);
           oldFallback.setDate(oldFallback.getDate() - 60);
           return oldFallback;
        }
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    
    // If no createdAt at all, default to today (for brand new routines)
    return now;
  }, [createdAt, today]);

  const heatmapData = useMemo(() => {
    const days = [];
    const curr = new Date(startPoint);
    
    // Align to the start of the week (Monday)
    const dayOfWeek = curr.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // diff to Monday
    curr.setDate(curr.getDate() - diff);

    // End point: end of today's week
    const last = new Date(today);
    const lastDayOfWeek = last.getDay();
    const lastDiff = (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek);
    last.setDate(last.getDate() + lastDiff);

    while (curr <= last) {
      days.push({
        date: new Date(curr),
        dateStr: formatLocalDate(curr),
        month: curr.getMonth(),
        isStartOfMonth: curr.getDate() <= 7 && curr.getDay() === 1, // First Monday of month
      });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [startPoint, today]);

  // Group by weeks for the grid
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  const [selectedMonth, setSelectedMonth] = useState({ 
    month: today.getMonth(), 
    year: today.getFullYear() 
  });

  const stats = useMemo(() => {
    const totalPossible = heatmapData.filter(d => d.date <= today && d.date >= startPoint).length;
    const completedCount = logs.filter(l => l.isDone).length;
    const percentage = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;
    return { totalPossible, completedCount, percentage };
  }, [heatmapData, logs, today, startPoint]);

  // Group days by month for the picker
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, { month: number; year: number }>();
    const now = new Date(today);
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    
    // Always include current month
    monthsMap.set(currentKey, { month: now.getMonth(), year: now.getFullYear() });

    // Include months that have logs
    logs.forEach(log => {
      const d = new Date(log.logDate);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthsMap.set(key, { month: d.getMonth(), year: d.getFullYear() });
      }
    });

    // Sort months descending
    return Array.from(monthsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [logs, today]);

  useEffect(() => {
    async function fetchHistory() {
      if (!token || !routineId) return;
      try {
        setIsLoading(true);
        // Use the same range as the heatmap
        const startDateStr = formatLocalDate(startPoint);
        const endDateStr = todayStr;
        const historyLogs = await routineService.getCalendarLogs(routineId, startDateStr, endDateStr, token);
        setLogs(historyLogs);
      } catch (err) {
        console.warn('Failed to load routine history', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [routineId, token, startPoint, todayStr]);

  const renderMonthPicker = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.pickerScroll}
        contentContainerStyle={styles.pickerContent}
      >
        {availableMonths.map((m, idx) => {
          const isSelected = selectedMonth.month === m.month && selectedMonth.year === m.year;
          return (
            <TouchableOpacity 
              key={`${m.month}-${m.year}`}
              onPress={() => setSelectedMonth(m)}
              style={[
                styles.pickerItem, 
                isSelected && { backgroundColor: themeColor, borderColor: themeColor }
              ]}
            >
              <Text style={[
                styles.pickerText, 
                { color: isSelected ? '#fff' : colors.textSecondary }
              ]}>
                {MONTHS[m.month]} {m.year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderCurrentMonthGrid = () => {
    const { month, year } = selectedMonth;
    
    // Calculate days in month and offset
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayDate = new Date(year, month, 1);
    const dayOfWeek = firstDayDate.getDay(); // 0-6 (Sun-Sat)
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0-6 (Mon-Sun)

    const gridItems = [];
    
    // 1. Add offset placeholders
    for (let i = 0; i < offset; i++) {
      gridItems.push({ type: 'empty', id: `empty-${i}` });
    }

    // 2. Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = formatLocalDate(d);
      gridItems.push({ type: 'day', date: d, dateStr: dStr, id: dStr });
    }

    return (
      <View style={styles.gridContainer}>
        {/* Weekday Labels Header */}
        <View style={styles.weekdayRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={`label-${i}`} style={styles.weekdayCell}>
              <Text style={[styles.weekdayLabel, { color: colors.textSecondary }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* The Grid */}
        <View style={styles.daysGrid}>
          {gridItems.map((item) => {
            if (item.type === 'empty') {
              return <View key={item.id} style={styles.dayCell} />;
            }

            const day = item as { date: Date; dateStr: string; id: string };
            const isCompleted = logs.some((l) => l.date === day.dateStr && l.isDone);
            const isToday = day.dateStr === todayStr;
            const isFuture = day.date > today;
            
            // If createdAt is missing, treat all past days as "before creation"
            const creationDateOnly = createdAt ? createdAt.split('T')[0] : todayStr;
            const isBeforeCreation = day.dateStr < creationDateOnly;

            let backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc';
            let borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
            let textColor = colors.textSecondary;

            if (isCompleted) {
              backgroundColor = themeColor;
              borderColor = themeColor;
              textColor = '#fff';
            } else if (isToday) {
              borderColor = themeColor;
              backgroundColor = isDark ? themeColor + '20' : themeColor + '10';
              textColor = themeColor;
            } else if (isFuture || isBeforeCreation) {
              backgroundColor = 'transparent';
              textColor = colors.textSecondary + '20';
            } else if (day.dateStr === creationDateOnly) {
              // Special case: The creation day itself should NOT be "missed" if not done
              backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc';
              borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0';
              textColor = colors.textSecondary + '40';
            } else {
              backgroundColor = isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.12)';
              borderColor = isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)';
              textColor = isDark ? '#fca5a5' : '#ef4444';
            }

            return (
              <View key={day.id} style={styles.dayCell}>
                <View
                  style={[
                    styles.daySquare,
                    {
                      backgroundColor,
                      borderColor,
                      borderStyle: isToday && !isCompleted ? 'dashed' : 'solid',
                    },
                  ]}
                >
                  <Text style={[styles.dayText, { color: textColor }]}>
                    {day.date.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Animated.View 
      entering={FadeInDown.duration(800).delay(100).springify()}
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)', 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        }
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: themeColor + '15' }]}>
          <Ionicons name="calendar" size={14} color={themeColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>History Dashboard</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={[styles.statValue, { color: themeColor }]}>{stats.percentage}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Score</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.completedCount}</Text>
          <Text style={[styles.statSub, { color: colors.textSecondary }]}>Done</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{stats.totalPossible}</Text>
          <Text style={[styles.statSub, { color: colors.textSecondary }]}>Days</Text>
        </View>
      </View>
      
      {renderMonthPicker()}

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={themeColor} />
        </View>
      ) : (
        <View style={styles.historyWrapper}>
          {renderCurrentMonthGrid()}
        </View>
      )}

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: themeColor }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Missed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'transparent', borderColor: themeColor, borderStyle: 'dashed', borderWidth: 1.5 }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Today</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
    paddingHorizontal: 2,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    display: 'none',
  },
  loadingBox: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyWrapper: {
    marginTop: 6,
  },
  pickerScroll: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  pickerContent: {
    gap: 6,
    paddingRight: 12,
  },
  pickerItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridContainer: {
    width: '100%',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
    width: '100%',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  daySquare: {
    width: '70%',
    height: '70%',
    borderRadius: 5,
    borderWidth: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statBadge: {
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statsBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    marginTop: 2,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  statSub: {
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 16,
    opacity: 0.2,
  },
});
