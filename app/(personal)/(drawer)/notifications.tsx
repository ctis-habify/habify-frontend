import { SwipeableNotificationRow } from '@/components/ui/swipeable-notification-row';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FriendRequestReceivedItem, friendService } from '@/services/friend.service';
import {
  BackendNotification,
  NotificationCategory,
  NotificationItem,
  notificationService,
} from '@/services/notification.service';
import { routineService } from '@/services/routine.service';
import { RoutineInvitationItem } from '@/types/routine-invitation';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLLABORATIVE_PRIMARY = '#E879F9';

const categoryTitle: Record<NotificationCategory, string> = {
  friend_requests: 'Requests & Invitations',
  unfinished_tasks: 'Unfinished Tasks',
  social_interactions: 'Social Interactions',
  rewards: 'Rewards',
};

const categoryIcon: Record<NotificationCategory, keyof typeof Ionicons.glyphMap> = {
  friend_requests: 'person-add-outline',
  unfinished_tasks: 'time-outline',
  social_interactions: 'people-outline',
  rewards: 'gift-outline',
};

const categoryOrder: NotificationCategory[] = [
  'friend_requests',
  'unfinished_tasks',
  'social_interactions',
  'rewards',
];

export default function NotificationsScreen(): React.ReactElement {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [backendReminders, setBackendReminders] = useState<BackendNotification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestReceivedItem[]>([]);
  const [routineInvitations, setRoutineInvitations] = useState<RoutineInvitationItem[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedSections, setLoadedSections] = useState({
    reminders: false,
    requests: false,
    invitations: false,
  });

  const fetchData = useCallback(() => {
    setItems(notificationService.getNotifications());

    const remindersP = notificationService
      .fetchNotifications(50, 0)
      .then((res) => {
        setBackendReminders(res.data);
        setLoadedSections((prev) => ({ ...prev, reminders: true }));
        notificationService.markAllAsRead().catch(() => { });
      })
      .catch(() => {
        setLoadedSections((prev) => ({ ...prev, reminders: true }));
      });

    friendService
      .getReceivedRequests()
      .then((data) => {
        setPendingRequests(data);
        setLoadedSections((prev) => ({ ...prev, requests: true }));
      })
      .catch(() => {
        setLoadedSections((prev) => ({ ...prev, requests: true }));
      });

    routineService
      .getPendingRoutineInvites()
      .then((data) => {
        setRoutineInvitations(data);
        setLoadedSections((prev) => ({ ...prev, invitations: true }));
      })
      .catch(() => {
        setLoadedSections((prev) => ({ ...prev, invitations: true }));
      });

    return remindersP;
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData()?.finally(() => setRefreshing(false));
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleDeleteNotification = useCallback(
    async (item: NotificationItem) => {
      setBackendReminders((prev) => prev.filter((r) => r.id !== item.id));
      setItems((prev) => prev.filter((n) => n.id !== item.id));
      notificationService.deleteNotification(item.id).catch(() => { });
    },
    [],
  );

  const handleAccept = useCallback(
    async (item: FriendRequestReceivedItem) => {
      setActioningId(item.id);
      try {
        await friendService.acceptRequest(item.id);
        setPendingRequests((prev) => prev.filter((r) => r.id !== item.id));
        Alert.alert('Success', `You are now friends with ${item.fromUser.name}`);
      } catch {
        Alert.alert('Error', 'Could not accept request.');
      } finally {
        setActioningId(null);
      }
    },
    [],
  );

  const handleDecline = useCallback(
    async (item: FriendRequestReceivedItem) => {
      setActioningId(item.id);
      try {
        await friendService.declineRequest(item.id);
        setPendingRequests((prev) => prev.filter((r) => r.id !== item.id));
      } catch {
        Alert.alert('Error', 'Could not decline request.');
      } finally {
        setActioningId(null);
      }
    },
    [],
  );

  const handleAcceptRoutine = useCallback(
    async (item: RoutineInvitationItem) => {
      setActioningId(item.id);
      try {
        await routineService.acceptRoutineInvite(item.id);
        setRoutineInvitations((prev) => prev.filter((r) => r.id !== item.id));
        Alert.alert('Success', `You have joined the collaborative routine: ${item.routineName}`);
      } catch {
        Alert.alert('Error', 'Could not accept routine invitation.');
      } finally {
        setActioningId(null);
      }
    },
    [],
  );

  const handleDeclineRoutine = useCallback(
    async (item: RoutineInvitationItem) => {
      setActioningId(item.id);
      try {
        await routineService.declineRoutineInvite(item.id);
        setRoutineInvitations((prev) => prev.filter((r) => r.id !== item.id));
      } catch {
        Alert.alert('Error', 'Could not decline routine invitation.');
      } finally {
        setActioningId(null);
      }
    },
    [],
  );

  const backendMappedItems = useMemo(() => {
    return backendReminders.map(notificationService.backendToLocal);
  }, [backendReminders]);

  const sections = useMemo(() => {
    const byCategory: Record<NotificationCategory, NotificationItem[]> = {
      friend_requests: [],
      unfinished_tasks: [],
      social_interactions: [],
      rewards: [],
    };

    // Add local items
    items.forEach((item) => {
      if (byCategory[item.category]) {
        byCategory[item.category].push(item);
      }
    });

    // Merge backend items into correct categories (deduped)
    const seenIds = new Set(items.map((i) => i.id));
    for (const mapped of backendMappedItems) {
      if (!seenIds.has(mapped.id) && byCategory[mapped.category]) {
        byCategory[mapped.category].push(mapped);
      }
    }

    // Sort each category by createdAt descending
    for (const key of Object.keys(byCategory) as NotificationCategory[]) {
      byCategory[key].sort((a, b) => b.createdAt - a.createdAt);
    }

    return byCategory;
  }, [items, backendMappedItems]);

  const background = getBackgroundGradient(theme);

  return (
    <LinearGradient colors={background} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={[styles.menuButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {categoryOrder.map((category) => (
          <View
            key={category}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name={categoryIcon[category]} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{categoryTitle[category]}</Text>
            </View>

            {category === 'friend_requests' ? (
              <>
                {!loadedSections.requests || !loadedSections.invitations ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.sectionLoader} />
                ) : pendingRequests.length === 0 && routineInvitations.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No pending requests.</Text>
                ) : (
                  <View style={{ gap: 10, marginTop: 8 }}>
                    {/* Render Friend Requests */}
                    {pendingRequests.map((item) => (
                      <View key={`fr-${item.id}`} style={[styles.actionRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                        <View style={styles.actionAvatarWrap}>
                          {item.fromUser.avatarUrl ? (
                            <Image source={{ uri: item.fromUser.avatarUrl }} style={styles.actionAvatar} />
                          ) : (
                            <View style={[styles.actionAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.actionAvatarLetter, { color: colors.white }]}>{item.fromUser.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.actionInfo}>
                          <Text style={[styles.actionName, { color: colors.text }]} numberOfLines={1}>{item.fromUser.name}</Text>
                          <Text style={[styles.actionMeta, { color: colors.textSecondary }]} numberOfLines={1}>wants to be friends</Text>
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.success }, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleAccept(item)}
                            disabled={actioningId !== null}
                          >
                            {actioningId === item.id ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="checkmark" size={18} color={colors.white} />}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.declineBtn, { backgroundColor: colors.error }, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleDecline(item)}
                            disabled={actioningId !== null}
                          >
                            <Ionicons name="close" size={18} color={colors.white} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {/* Render Routine Invitations */}
                    {routineInvitations.map((item) => (
                      <View key={`ri-${item.id}`} style={[styles.actionRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
                        <View style={styles.actionAvatarWrap}>
                          {item.fromUserAvatarUrl ? (
                            <Image source={{ uri: item.fromUserAvatarUrl }} style={styles.actionAvatar} />
                          ) : (
                            <View style={[styles.actionAvatarPlaceholder, { backgroundColor: COLLABORATIVE_PRIMARY }]}>
                              <Text style={[styles.actionAvatarLetter, { color: colors.white }]}>{item.fromUserName ? item.fromUserName.charAt(0).toUpperCase() : '?'}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.actionInfo}>
                          <Text style={[styles.actionName, { color: colors.text }]} numberOfLines={1}>
                            {item.routineName || 'Unnamed Routine'}
                          </Text>
                          <Text style={[styles.actionMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            invite from {item.fromUserName || 'Unknown'}
                          </Text>
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.success }, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleAcceptRoutine(item)}
                            disabled={actioningId !== null}
                          >
                            {actioningId === item.id ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="checkmark" size={18} color={colors.white} />}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.declineBtn, { backgroundColor: colors.error }, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleDeclineRoutine(item)}
                            disabled={actioningId !== null}
                          >
                            <Ionicons name="close" size={18} color={colors.white} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                {!loadedSections.reminders ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.sectionLoader} />
                ) : sections[category].length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No notifications yet.</Text>
                ) : (
                  <ScrollView
                    style={styles.sectionScroll}
                    contentContainerStyle={styles.sectionScrollContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    persistentScrollbar
                  >
                    {sections[category].map((item) => (
                      <SwipeableNotificationRow
                        key={item.id}
                        onDelete={() => handleDeleteNotification(item)}
                      >
                        <View
                          style={[
                            styles.itemRow,
                            { backgroundColor: colors.card },
                            item.isRead === false && styles.unreadRow,
                            category === 'rewards' && styles.rewardRow,
                          ]}
                        >
                          {item.isRead === false && <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />}
                          <View style={styles.itemContent}>
                            {category === 'rewards' ? (
                              <View style={styles.rewardHeader}>
                                <Ionicons name="trophy" size={16} color="#F59E0B" />
                                <Text style={[styles.rewardTitle, { color: colors.text }]}>
                                  {item.title ?? 'Reward unlocked'}
                                </Text>
                              </View>
                            ) : null}
                            <Text style={[styles.itemText, { color: colors.text }]}>{item.message}</Text>
                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' · '}
                              {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </Text>
                          </View>
                        </View>
                      </SwipeableNotificationRow>
                    ))}
                  </ScrollView>
                )}
              </>
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
    padding: 18,
    paddingBottom: 100,
    gap: 12,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionScroll: {
    maxHeight: 280,
  },
  sectionScrollContent: {
    gap: 1,
  },
  sectionLoader: {
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  itemRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  rewardRow: {
    paddingVertical: 12,
  },
  unreadRow: {
    paddingLeft: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  actionAvatarWrap: {
    marginRight: 10,
  },
  actionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  actionAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionAvatarLetter: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionInfo: {
    flex: 1,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {},
  declineBtn: {},
  btnDisabled: {
    opacity: 0.5,
  },
});
