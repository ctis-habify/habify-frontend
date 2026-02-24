import { getBackgroundGradient } from '@/app/theme';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FriendRequestReceivedItem, friendService } from '@/services/friend.service';
import {
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
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLLABORATIVE_PRIMARY = '#E879F9';

const categoryTitle: Record<NotificationCategory, string> = {
  friend_requests: 'Requests & Invitations',
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
  const [pendingRequests, setPendingRequests] = useState<FriendRequestReceivedItem[]>([]);
  const [routineInvitations, setRoutineInvitations] = useState<RoutineInvitationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [localItems, requests, invites] = await Promise.all([
        Promise.resolve(notificationService.getNotifications()),
        friendService.getReceivedRequests().catch(() => []),
        routineService.getPendingRoutineInvites().catch(() => []),
      ]);
      setItems(localItems);
      setPendingRequests(requests);
      setRoutineInvitations(invites);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
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

            {category === 'friend_requests' ? (
              <>
                {pendingRequests.length === 0 && routineInvitations.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.icon }]}>No pending requests.</Text>
                ) : (
                  <View style={{ gap: 10, marginTop: 8 }}>
                    {/* Render Friend Requests */}
                    {pendingRequests.map((item) => (
                      <View key={`fr-${item.id}`} style={[styles.actionRow, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                        <View style={styles.actionAvatarWrap}>
                          {item.fromUser.avatarUrl ? (
                            <Image source={{ uri: item.fromUser.avatarUrl }} style={styles.actionAvatar} />
                          ) : (
                            <View style={[styles.actionAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                              <Text style={styles.actionAvatarLetter}>{item.fromUser.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.actionInfo}>
                          <Text style={[styles.actionName, { color: colors.text }]} numberOfLines={1}>{item.fromUser.name}</Text>
                          <Text style={[styles.actionMeta, { color: colors.icon }]} numberOfLines={1}>wants to be friends</Text>
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleAccept(item)}
                            disabled={actioningId !== null}
                          >
                            {actioningId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={18} color="#fff" />}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.declineBtn, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleDecline(item)}
                            disabled={actioningId !== null}
                          >
                            <Ionicons name="close" size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {/* Render Routine Invitations */}
                    {routineInvitations.map((item) => (
                      <View key={`ri-${item.id}`} style={[styles.actionRow, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                        <View style={styles.actionAvatarWrap}>
                          {item.fromUserAvatarUrl ? (
                            <Image source={{ uri: item.fromUserAvatarUrl }} style={styles.actionAvatar} />
                          ) : (
                            <View style={[styles.actionAvatarPlaceholder, { backgroundColor: COLLABORATIVE_PRIMARY }]}>
                              <Text style={styles.actionAvatarLetter}>{item.fromUserName ? item.fromUserName.charAt(0).toUpperCase() : '?'}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.actionInfo}>
                          <Text style={[styles.actionName, { color: colors.text }]} numberOfLines={1}>
                            {item.routineName || 'Unnamed Routine'}
                          </Text>
                          <Text style={[styles.actionMeta, { color: colors.icon }]} numberOfLines={1}>
                            invite from {item.fromUserName || 'Unknown'}
                          </Text>
                        </View>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleAcceptRoutine(item)}
                            disabled={actioningId !== null}
                          >
                            {actioningId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={18} color="#fff" />}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.declineBtn, actioningId === item.id && styles.btnDisabled]}
                            onPress={() => handleDeclineRoutine(item)}
                            disabled={actioningId !== null}
                          >
                            <Ionicons name="close" size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionInfo: {
    flex: 1,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionMeta: {
    fontSize: 12,
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
  acceptBtn: {
    backgroundColor: Colors.light.success,
  },
  declineBtn: {
    backgroundColor: Colors.light.error,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

