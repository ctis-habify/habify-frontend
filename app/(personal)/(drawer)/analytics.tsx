import { HomeButton } from '@/components/navigation/home-button';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { analyticsService, AnalyticsEvent } from '@/services/analytics.service';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnalyticsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];
  
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await analyticsService.clearLogs();
    setEvents([]);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <LinearGradient colors={getBackgroundGradient(colorScheme)} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={[styles.menuButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics & Data</Text>
        <HomeButton color={colors.text} style={[styles.menuButton, { backgroundColor: colors.surface }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Data Preservation Policy Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color={isDark ? colors.secondary : colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Data Preservation Policy</Text>
          </View>
          <Text style={[styles.policyText, { color: colors.textSecondary }]}>
            Habify is built to support your long-term evolution. Your <Text style={styles.boldText}>streaks, routine history, and detailed analytics</Text> are preserved indefinitely.
          </Text>
          <View style={[styles.policyNote, { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.1)' : 'rgba(124, 58, 237, 0.05)' }]}>
            <Ionicons name="information-circle" size={18} color={isDark ? colors.secondary : colors.primary} />
            <Text style={[styles.policyNoteText, { color: isDark ? colors.secondary : colors.primary }]}>
              Data is only removed if you choose to permanently delete your account.
            </Text>
          </View>
        </View>

        {/* Background Logs / Minor Events */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Minor Events & Background Logs</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.clearText, { color: colors.error }]}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="sparkles-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No errors or events recorded yet. Good job!</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.logHeader}>
                <View style={[styles.severityBadge, { backgroundColor: event.severity === 'warning' ? '#f59e0b' : event.severity === 'minor' ? '#3b82f6' : colors.textTertiary }]}>
                  <Text style={styles.severityText}>{event.severity}</Text>
                </View>
                <Text style={[styles.logTime, { color: colors.textTertiary }]}>{formatDate(event.timestamp)}</Text>
              </View>
              <Text style={[styles.logType, { color: colors.text }]}>{event.type}</Text>
              <Text style={[styles.logMessage, { color: colors.textSecondary }]}>{event.message}</Text>
            </View>
          ))
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  policyText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 20,
  },
  boldText: {
    fontWeight: '800',
  },
  policyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 10,
  },
  policyNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  logCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  logTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  logType: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
