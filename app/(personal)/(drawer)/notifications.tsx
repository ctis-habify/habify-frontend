import { getBackgroundGradient } from '@/app/theme';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  NotificationCategory,
  NotificationItem,
  notificationService,
} from '@/services/notification.service';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const categoryTitle: Record<NotificationCategory, string> = {
  friend_requests: 'Friend Requests',
  unfinished_tasks: 'Unfinished Tasks',
  social_interactions: 'Social Interactions',
};

const categoryIcon: Record<NotificationCategory, keyof typeof Ionicons.glyphMap> = {
  friend_requests: 'person-add-outline',
  unfinished_tasks: 'time-outline',
  social_interactions: 'people-outline',
};

export default function NotificationsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [items, setItems] = useState<NotificationItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      setItems(notificationService.getNotifications());
    }, []),
  );

  const sections = useMemo(() => {
    const byCategory: Record<NotificationCategory, NotificationItem[]> = {
      friend_requests: [],
      unfinished_tasks: [],
      social_interactions: [],
    };

    items.forEach((item) => byCategory[item.category].push(item));
    return byCategory;
  }, [items]);

  const background = getBackgroundGradient(theme);

  return (
    <LinearGradient colors={background} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => (navigation as any).dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {(Object.keys(sections) as NotificationCategory[]).map((category) => (
          <View
            key={category}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name={categoryIcon[category]} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{categoryTitle[category]}</Text>
            </View>

            {sections[category].length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.icon }]}>No notifications yet.</Text>
            ) : (
              sections[category].map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemRow, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.itemText, { color: colors.text }]}>{item.message}</Text>
                  <Text style={[styles.timeText, { color: colors.icon }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 12,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 8,
  },
  itemRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
    gap: 4,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
  },
});

