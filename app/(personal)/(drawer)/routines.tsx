import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, DeviceEventEmitter, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// UI
import { CelebrationAnimation } from '@/components/animations/celebration-animation';
import { CannotDeleteListModal } from '@/components/modals/cannot-delete-list-modal';
import { CreateRoutineInListModal } from '@/components/modals/create-routine-in-list-modal';
import { CreateRoutineModal } from '@/components/modals/create-routine-modal';
import { DeleteListModal } from '@/components/modals/delete-list-modal';
import { RoutineCategoryCard } from '@/components/routines/routine-category-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { getCategoryAccentColor } from '@/constants/category-colors';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import type { RoutineList, RoutineLog } from '@/types/routine';

const TOKEN_KEY = 'habify_access_token';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

const ENTER_SPRING = { damping: 35, stiffness: 80, mass: 1.0 };

export default function PersonalRoutinesScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useColorScheme() ?? 'light';
  const { token: authContextToken } = useAuth();
  const colors = Colors[theme];
  const screenGradient = getBackgroundGradient(theme);
  const activeTab = 'Personal';
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(40);
  const scale = useSharedValue(0.97);

  const pageStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
    ],
  }));

  const trophyY = useSharedValue(0);
  useEffect(() => {
    trophyY.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [trophyY]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(trophyY.value, [0, 1], [0, -12]) },
      { scale: scale.value },
    ],
  }));

  const isSwitchingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [routineLists, setRoutineLists] = useState<RoutineList[]>([]);
  const [selectedListForNewRoutine, setSelectedListForNewRoutine] = useState<{ listId: number; categoryId?: number | null } | null>(null);
  const [editListParams, setEditListParams] = useState<{ listId: number; title: string; categoryId?: number } | null>(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);
  const [hasPendingCelebration, setHasPendingCelebration] = useState(false);
  const [deleteListModalVisible, setDeleteListModalVisible] = useState(false);
  const [cannotDeleteModalVisible, setCannotDeleteModalVisible] = useState(false);
  const [listToDelete, setListToDelete] = useState<RoutineList | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const isFocused = useIsFocused();

  const loadLists = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const token: string | null = authContextToken || await getToken();

      if (token) {
        const [lists, logs] = await Promise.all([
          routineService.getGroupedRoutines(token),
          routineService.getRoutineLogs().catch((): RoutineLog[] => []),
        ]);

        const now = new Date();
        const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const completedToday = new Set<string>(
          logs
            .filter(log => {
              if (!log.logDate) return false;
              const d = new Date(log.logDate);
              const logStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return logStr === localTodayStr;
            })
            .map(log => log.routineId)
        );

        const listsWithCompletion = lists.map(list => ({
          ...list,
          routines: list.routines.map(r => ({
            ...r,
            isDone: r.isDone || r.isCompleted || completedToday.has(r.id),
          })),
        }));

        setRoutineLists(listsWithCompletion);
      }
    } catch (e: unknown) {
      console.error('Error loading personal routine lists:', e);
      const msg: string = e instanceof Error ? e.message : 'Failed to load routines.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [authContextToken]);

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateX.value = 40;
      scale.value = 0.97;

      opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      translateX.value = withSpring(0, ENTER_SPRING);
      scale.value = withSpring(1, ENTER_SPRING);

      loadLists();
    }, [loadLists, opacity, translateX, scale]),
  );

  useEffect(() => {
    loadLists();
    const sub = DeviceEventEmitter.addListener('refreshPersonalRoutines', () => {
      loadLists();
    });

    const celebrationSub = DeviceEventEmitter.addListener('PERSONAL_ROUTINE_COMPLETED', () => {
      setHasPendingCelebration(true);
    });

    return () => {
      sub.remove();
      celebrationSub.remove();
    };
  }, [loadLists]);

  useEffect(() => {
    if (isFocused && hasPendingCelebration) {
      setHasPendingCelebration(false);
      setTimeout(() => {
        setCelebrationTrigger(prev => prev + 1);
        setCelebrationVisible(true);
      }, 500);
    }
  }, [isFocused, hasPendingCelebration]);

  const handleTabSwitch = useCallback((tab: string): void => {
    if (tab !== 'Collaborative' || isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        router.replace('/(collaborative)/(drawer)/routines');
        isSwitchingRef.current = false;
      }, 90);
    });
  }, [router]);

  const handleAddRoutine = useCallback((listId: string | number, categoryId?: number | null): void => {
    if (!listId) {
      Alert.alert('Error', 'Routine List ID is missing or null.');
      return;
    }
    setSelectedListForNewRoutine({ listId: Number(listId), categoryId });
  }, []);

  const handleEditList = useCallback((list: RoutineList): void => {
    const listId: number | undefined = list.id ?? (list as RoutineList & { routineListId?: number }).routineListId;
    if (!listId) return;
    setEditListParams({
      listId: Number(listId),
      title: list.routineListTitle || list.categoryName || '',
      categoryId: list.categoryId || undefined,
    });
  }, []);

  const handleDeleteList = (list: RoutineList) => {
    if (list.routines && list.routines.length > 0) {
      setCannotDeleteModalVisible(true);
      return;
    }

    setListToDelete(list);
    setDeleteListModalVisible(true);
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;
    const listId = listToDelete.id ?? (listToDelete as RoutineList & { routineListId?: number }).routineListId;
    if (!listId) return;

    try {
      setIsDeletingList(true);
      const token = authContextToken || await getToken();
      if (!token) return;
      await routineService.deleteRoutineList(Number(listId), token);
      setRoutineLists((current: RoutineList[]) =>
        current.filter((item: RoutineList) => {
          const currentId =
            item.id ?? (item as RoutineList & { routineListId?: number }).routineListId;
          return Number(currentId) !== Number(listId);
        }),
      );
      await loadLists();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete list.';
      Alert.alert('Error', msg);
      throw err;
    } finally {
      setIsDeletingList(false);
    }
  };

  const handlePressRoutine = (routineId: string) => {
    router.push({ pathname: '/(personal)/routine/[id]', params: { id: routineId } });
  };

  const hasNoData = !loading && routineLists.length === 0;

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: screenGradient[0] }, pageStyle]}>
      <LinearGradient colors={screenGradient} style={styles.container}>
        {/* HEADER */}
        <View style={styles.fixedHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={[styles.menuBtn, { backgroundColor: colors.surface }]}
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            >
              <Ionicons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AnimatedTabSwitcher
                tabs={['Personal', 'Collaborative']}
                activeTab={activeTab}
                onTabPress={handleTabSwitch}
                activeColor={colors.tint}
              />
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          layout={LinearTransition.springify().damping(18)}
        >
          {/* Today's Routines' Header */}
          <Animated.View entering={FadeInDown.delay(180).duration(560).springify()}>
            <TouchableOpacity
              style={[styles.sectionHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => router.push('/(personal)/(drawer)/today-routines')}
            >
              <View style={styles.sectionHeaderContent}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="today" size={20} color={colors.primary} />
                </View>
                <View style={styles.sectionTextContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Today&apos;s Routines</Text>
                  <Text style={[styles.sectionSubTitle, { color: colors.textSecondary }]}>View your schedule and progress</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {loading && <ActivityIndicator size="large" color={colors.textSecondary} style={{ marginTop: 40 }} />}

          {!loading && routineLists.map((list, idx) => {
            const accentColor = getCategoryAccentColor(list.categoryName, list.categoryId ?? null);

            const routinesProps = (list.routines || []).map(r => ({
              id: r.id,
              name: r.routineName || r.title,
              durationLabel: r.remainingLabel || 'Pending',
              completed: r.isCompleted || r.isDone,
              failed: r.isFailed,
              startTime: r.startTime,
              endTime: r.endTime,
              frequencyType: r.frequencyType,
              categoryName: r.categoryName,
              streak: r.streak,
              missedCount: r.missedCount,
              collaborativeKey: r.collaborativeKey,
              creatorId: r.creatorId,
            }));

            return (
              <Animated.View
                key={`list-${list.id ?? idx}-${idx}`}
                entering={FadeInDown.delay(idx * 80).duration(800).springify().damping(28).stiffness(100)}
                exiting={FadeOutUp}
                layout={LinearTransition.springify().damping(28).stiffness(120).duration(650)}
              >
                <RoutineCategoryCard
                  title={list.routineListTitle || list.categoryName || 'List'}
                  subtitle={`${list.routines?.length || 0} routines`}
                  categoryName={list.categoryName}
                  routines={routinesProps}
                  onItemPress={handlePressRoutine}
                  onPressAddRoutine={() => handleAddRoutine(list.id ?? (list as RoutineList & { routineListId?: number }).routineListId, list.categoryId)}
                  onEditList={() => handleEditList(list)}
                  onDeleteList={() => handleDeleteList(list)}
                  accentColor={accentColor}
                  variant={theme === 'dark' ? 'glass' : 'light'}
                />
              </Animated.View>
            );
          })}

          {hasNoData && (
            <View style={styles.emptyOuter}>
              <Animated.View style={trophyStyle}>
                <View style={[styles.trophyWrapper, { borderColor: colors.primary + '30', backgroundColor: colors.surface }]}>
                  <Ionicons name="trophy" size={80} color={colors.primary} />
                </View>
              </Animated.View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>You haven&apos;t created a routine yet.</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                You can create a new list by clicking the button below.
              </Text>

              <TouchableOpacity
                style={[
                  styles.createBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => router.push('/(personal)/create-routine')}
              >
                <Text style={[styles.createBtnText, { color: colors.text }]}>Create Routine List</Text>
              </TouchableOpacity>
            </View>
          )}

          {!hasNoData && !loading && (
            <Animated.View entering={FadeInDown.delay(220).duration(560).springify()}>
              <TouchableOpacity
                style={[
                  styles.createBtn,
                  {
                    marginTop: 10,
                    backgroundColor: colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => router.push('/(personal)/create-routine')}
              >
                <Text style={[styles.createBtnText, { color: colors.text }]}>Create Routine List</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.ScrollView>
        <CreateRoutineInListModal
          visible={selectedListForNewRoutine !== null}
          routineListId={selectedListForNewRoutine?.listId ?? null}
          categoryId={selectedListForNewRoutine?.categoryId ?? null}
          onClose={() => setSelectedListForNewRoutine(null)}
          onCreated={() => {
            setSelectedListForNewRoutine(null);
            loadLists();
          }}
        />

        {editListParams && (
          <CreateRoutineModal
            initialRoutineListId={editListParams.listId}
            initialTitle={editListParams.title}
            initialCategoryId={editListParams.categoryId}
            onClose={() => setEditListParams(null)}
            onCreated={() => {
              setEditListParams(null);
              loadLists();
            }}
          />
        )}

        <DeleteListModal
          visible={deleteListModalVisible}
          listTitle={listToDelete?.routineListTitle || listToDelete?.categoryName || 'List'}
          onClose={() => {
            setDeleteListModalVisible(false);
            setListToDelete(null);
          }}
          onConfirm={confirmDeleteList}
          isLoading={isDeletingList}
        />

        <CannotDeleteListModal
          visible={cannotDeleteModalVisible}
          onClose={() => setCannotDeleteModalVisible(false)}
        />

        <CelebrationAnimation
          play={celebrationVisible}
          triggerKey={celebrationTrigger}
          onComplete={() => setCelebrationVisible(false)}
        />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: {
    paddingTop: 60,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    height: 48,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.7,
  },
  emptyOuter: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  trophyWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
    borderWidth: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '85%',
  },
  createBtn: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
