import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

// Themes & Components
import { EliminationModal } from '@/components/modals/elimination-modal';
import { LeaveRoutineModal } from '@/components/modals/leave-routine-modal';
import { CollaborativeGroupCard } from '@/components/routines/collaborative-group-card';
import { CollaborativeScoreBanner } from '@/components/routines/collaborative-score-banner';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
import { getCategoryAccentColor } from '@/constants/category-colors';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCollaborativeScore } from '@/hooks/use-collaborative-score';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { categoryService } from '@/services/category.service';
import { notificationService } from '@/services/notification.service';
import { routineService } from '@/services/routine.service';
import { Category } from '@/types/category';
import { PublicRoutine, Routine } from '@/types/routine';

export default function CollaborativeRoutinesScreen(): React.ReactElement {
  // 1. Hooks
  const router = useRouter();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;
  const screenGradient = getBackgroundGradient(theme, 'collaborative');
  const {
    points: collabPoints,
    streak: collabStreak,
    nextBonusStreak,
    nextBonusPoints,
    rank: collabRank,
    loading: collabScoreLoading
  } = useCollaborativeScore();

  // 2. State
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leavingRoutineId, setLeavingRoutineId] = useState<string | null>(null);
  const [leavingRoutine, setLeavingRoutine] = useState<Routine | null>(null);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);

  // Public Search State
  const [publicRoutines, setPublicRoutines] = useState<PublicRoutine[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [frequencyType, setFrequencyType] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [eliminationModalVisible, setEliminationModalVisible] = useState(false);
  const [eliminatedRoutineNames, setEliminatedRoutineNames] = useState<string[]>([]);

  const activeTab = 'Collaborative';
  const isSwitchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownEliminationRef = useRef(false);

  // Animation Setup 
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(40);
  const scale = useSharedValue(0.97);

  const ENTER_SPRING = { damping: 35, stiffness: 80, mass: 1.0 };

  const pageStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  // 3. Callbacks (Memoized)
  const showToast = useCallback((message: string): void => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const loadLists = useCallback(
    async (refresh: boolean = false): Promise<void> => {
      if (refresh || routines.length === 0) setLoading(true);
      setIsRefreshing(refresh);
      try {
        const list = await routineService.getCollaborativeRoutines();

        // Batch Lazy Elimination Cleanup
        const currentUserId: string = user?.id ? String(user.id).trim() : '';
        const eliminatedNames: string[] = [];
        const healthyRoutines = list.filter((r: Routine) => {
          const health: number = (r.lives ?? 0) - (r.missedCount ?? 0);
          if (health <= 0) {
            eliminatedNames.push(r.routineName || 'Unnamed Routine');
            // Silent cleanup in background
            const isCreator: boolean = !!currentUserId && !!r.creatorId && currentUserId === String(r.creatorId).trim();
            if (isCreator) {
              routineService.handleCreatorDefeat(r.id).catch((err: unknown) =>
                console.error(`[Cleanup] Failed to handle creator defeat for routine ${r.id}:`, err)
              );
            } else {
              routineService.leaveRoutine(r.id).catch((err: unknown) =>
                console.error(`[Cleanup] Failed to leave routine ${r.id}:`, err)
              );
            }
            return false;
          }
          return true;
        });

        if (eliminatedNames.length > 0 && !hasShownEliminationRef.current) {
          setEliminatedRoutineNames(eliminatedNames);
          setEliminationModalVisible(true);
          hasShownEliminationRef.current = true;
        }

        setRoutines([...healthyRoutines].reverse());
        const socialReminder = notificationService.getSocialInteractionReminder(healthyRoutines.length);
        if (socialReminder) showToast(socialReminder);
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'Failed to load collaborative routines');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [routines.length, showToast, user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      if (opacity.value === 0) {
        translateX.value = 40;
        scale.value = 0.97;
        opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
        translateX.value = withSpring(0, ENTER_SPRING);
        scale.value = withSpring(1, ENTER_SPRING);
      }
      loadLists();
    }, [loadLists]),
  );

  const fetchPublicRoutines = useCallback(async (q?: string, catId?: number | '', freq?: string): Promise<void> => {
    setLoadingPublic(true);
    try {
      const data = await routineService.browsePublicRoutines(q || undefined, catId || undefined, freq || undefined);
      setPublicRoutines(data);
    } catch {
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  const handleJoin = useCallback(
    async (id: string): Promise<void> => {
      try {
        const res = await routineService.joinPublicRoutine(id);
        showToast(res.message);
        loadLists(false);
        setPublicRoutines((prev: PublicRoutine[]) =>
          prev.map((r: PublicRoutine) => (r.id === id ? { ...r, isAlreadyMember: true, memberCount: r.memberCount + 1 } : r)),
        );
        DeviceEventEmitter.emit('SHOW_TOAST', 'Successfully joined the routine!');
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to join routine');
      }
    },
    [loadLists, showToast],
  );

  const handleTabSwitch = useCallback((tab: string): void => {
    if (tab !== 'Personal' || isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      setTimeout(() => {
        router.replace('/(personal)/(drawer)/routines');
        isSwitchingRef.current = false;
      }, 90);
    });
  }, [router]);

  const handleOpenRoutineView = useCallback(
    (routine: Routine): void => {
      if (!routine?.id) return;
      router.push({
        pathname: '/(collaborative)/routine/[id]/chat',
        params: {
          id: routine.id,
          routineName: routine.routineName || '',
          description: routine.description || '',
          categoryName: routine.categoryName || '',
          startTime: routine.startTime || '',
          endTime: routine.endTime || '',
          frequencyType: routine.frequencyType || '',
          lives: String(routine.lives ?? 0),
          streak: String(routine.streak ?? 0),
          rewardCondition: routine.rewardCondition || '',
          genderRequirement: routine.genderRequirement || '',
          ageRequirement: String(routine.ageRequirement ?? ''),
          isPublic: routine.isPublic ? '1' : '0',
          userId: routine.creatorId || routine.userId || '',
        },
      });
    },
    [router],
  );

  const handleLeaveRoutine = useCallback(
    (routine: Routine): void => {
      if (!routine?.id) return;
      setLeavingRoutine(routine);
      setIsLeaveModalVisible(true);
    },
    [],
  );

  const confirmDeleteRoutine = useCallback(async (routine: Routine): Promise<void> => {
    if (!routine.id || !token) return;
    setDeletingRoutineId(routine.id);
    try {
      await routineService.deleteRoutine(routine.id, token);
      showToast('Routine has been deleted.');
      setRoutines((prev: Routine[]) => prev.filter((r: Routine) => r.id !== routine.id));
    } catch (err: unknown) {
      const message: string =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not delete the routine. Please try again.';
      showToast(message);
    } finally {
      setDeletingRoutineId(null);
    }
  }, [showToast, token]);

  const handleDeleteRoutine = useCallback(
    (routine: Routine): void => {
      if (!routine?.id) return;
      confirmDeleteRoutine(routine);
    },
    [confirmDeleteRoutine],
  );

  const confirmLeaveRoutine = useCallback(async (): Promise<void> => {
    if (!leavingRoutine?.id) return;
    setLeavingRoutineId(leavingRoutine.id);
    try {
      await routineService.leaveRoutine(leavingRoutine.id);
      showToast('You have left the routine.');
      setRoutines((prev: Routine[]) => prev.filter((r: Routine) => r.id !== leavingRoutine.id));
      setPublicRoutines((prev: PublicRoutine[]) =>
        prev.map((r: PublicRoutine) => r.id === leavingRoutine.id ? { ...r, isAlreadyMember: false, memberCount: Math.max(0, r.memberCount - 1) } : r)
      );
    } catch (err: unknown) {
      const message: string =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not leave the routine. Please try again.';
      showToast(message);
      throw err;
    } finally {
      setLeavingRoutineId(null);
    }
  }, [leavingRoutine, showToast]);

  // 4. Effects
  useEffect(() => {
    const loadCats = async () => {
      setLoadingCategories(true);
      try {
        const cats = await categoryService.getCategories('collaborative');
        setCategories(cats);
      } catch {
        // ignore
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCats();
  }, []);



  const handleClearCategoryId = useCallback((): void => {
    setCategoryId('');
  }, []);

  const handleCategorySelect = useCallback((id: number): void => {
    setCategoryId(id);
  }, []);

  const handleFrequencyToggle = useCallback((freq: string): void => {
    setFrequencyType((prev: string) => prev === freq ? '' : freq);
  }, []);

  const handleSearchChange = useCallback((text: string): void => {
    setSearch(text);
  }, []);

  const handleClearSearch = useCallback((): void => {
    setSearch('');
  }, []);

  const handleCreateRoutinePress = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(collaborative)/create-routine');
  }, [router]);

  const handleBrowsePress = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(collaborative)/(drawer)/browse');
  }, [router]);

  useEffect(() => {
    const subscription: { remove: () => void } = DeviceEventEmitter.addListener('SHOW_TOAST', (message: string) => {
      setTimeout(() => {
        showToast(message);
      }, 500);
    });
    const leaveSubscription = DeviceEventEmitter.addListener(
      'refreshCollaborativeRoutines',
      () => {
        loadLists(true);
      },
    );
    return () => {
      subscription.remove();
      leaveSubscription.remove();
    };
  }, [showToast, loadLists]);

  // 5. Render
  return (
    <Animated.View style={[{ backgroundColor: screenGradient[0] }, pageStyle]}>
      <LinearGradient colors={screenGradient} style={styles.container}>
        {/* FIXED HEADER SECTION */}
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
                activeColor={collaborativePrimary}
              />
            </View>
          </View>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          layout={LinearTransition.springify().damping(28).stiffness(120).duration(650)}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadLists(true)}
              tintColor={collaborativePrimary}
              colors={[collaborativePrimary]}
            />
          }
        >
          {/* Collaborative Score Banner */}
          <CollaborativeScoreBanner
            points={collabPoints}
            streak={collabStreak}
            nextBonusStreak={nextBonusStreak}
            nextBonusPoints={nextBonusPoints}
            rank={collabRank}
            loading={collabScoreLoading}
            accentColor={collaborativePrimary}
          />

          {/* Discovery Entry Point */}
          <TouchableOpacity
            style={styles.discoveryCard}
            onPress={handleBrowsePress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ['#E879F9', '#A21CAF'] : ['#F472B6', '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discoveryGradient}
            >
              <View style={styles.discoveryContent}>
                <View style={styles.discoveryTextWrap}>
                  <Text style={styles.discoveryTitle}>Browse All Routines</Text>
                  <Text style={styles.discoverySubtitle}>Discover public groups & join new habits</Text>
                </View>
                <View style={styles.discoveryIconBox}>
                  <Ionicons name="search" size={20} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Category Chips */}
          <View style={{ marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              <TouchableOpacity
                onPress={handleClearCategoryId}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  categoryId === '' && { backgroundColor: collaborativePrimary, borderColor: collaborativePrimary }
                ]}
              >
                <Text style={[styles.chipText, { color: colors.textSecondary }, categoryId === '' && { color: '#fff' }]}>All</Text>
              </TouchableOpacity>
              {categories.map((c: Category) => (
                <TouchableOpacity
                  key={c.categoryId}
                  onPress={() => handleCategorySelect(c.categoryId)}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    categoryId === c.categoryId && { backgroundColor: collaborativePrimary, borderColor: collaborativePrimary }
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, categoryId === c.categoryId && { color: '#fff' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick Frequency Filter */}
          <View style={{ marginBottom: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <View style={styles.filterGroup}>
                <Text style={[styles.miniLabel, { color: colors.textTertiary }]}>FREQ</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['Daily', 'Weekly'].map((f: string) => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => handleFrequencyToggle(f)}
                      style={[
                        styles.miniChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        frequencyType === f && { backgroundColor: collaborativePrimary, borderColor: collaborativePrimary }
                      ]}
                    >
                      <Text style={[styles.miniChipText, { color: colors.textSecondary }, frequencyType === f && { color: '#fff' }]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search your routines…"
              placeholderTextColor={colors.icon}
              value={search}
              onChangeText={handleSearchChange}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          {/* Loading State Overlay to prevent 'Double Pass' feeling */}
          {loading && (
            <View style={{ paddingVertical: 100, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={collaborativePrimary} />
              <Text style={{ marginTop: 15, color: colors.text, opacity: 0.5, fontWeight: '500' }}>Loading routines...</Text>
            </View>
          )}



          {/* Section: My Joined Routines */}
          {!loading && routines.length > 0 && (
            <>
              {/* Public Enrollments */}
              {routines.some(r => r.isPublic) && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.5 }]}>Public Enrollments</Text>
                    <View style={[styles.badge, { backgroundColor: collaborativePrimary }]}><Text style={[styles.badgeText, { color: colors.white }]}>{routines.filter(r => r.isPublic).length}</Text></View>
                  </View>
                  {routines
                    .filter(r => r.isPublic)
                    .filter((routine): routine is Routine => {
                      const lowerSearch = search.toLowerCase();
                      const matchesSearch = !search || routine.routineName?.toLowerCase().includes(lowerSearch) || routine.categoryName?.toLowerCase().includes(lowerSearch);
                      const selectedCat = categories.find(c => c.categoryId === categoryId);
                      const matchesCategory = !categoryId || routine.categoryName === selectedCat?.name;
                      const matchesFreq = !frequencyType || routine.frequencyType?.toLowerCase() === frequencyType.toLowerCase();
                      return matchesSearch && matchesCategory && matchesFreq;
                    })
                    .map((routine, index) => {
                      const accentColor = getCategoryAccentColor(routine.categoryName, null);
                      return (
                        <Animated.View
                          key={routine.id}
                          entering={FadeInDown.delay(index * 80).duration(800).springify().damping(28).stiffness(100)}
                          exiting={FadeOutUp}
                          layout={LinearTransition.springify().damping(28).stiffness(120).duration(650)}
                        >
                          <CollaborativeGroupCard
                            routine={routine}
                            accentColor={accentColor}
                            onPress={handleOpenRoutineView}
                            onLeave={handleLeaveRoutine}
                            onDelete={handleDeleteRoutine}
                            isLeaving={leavingRoutineId === routine.id}
                            isDeleting={deletingRoutineId === routine.id}
                          />
                        </Animated.View>
                      );
                    })}
                </>
              )}

              {/* Private Enrollments */}
              {routines.some(r => !r.isPublic) && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.5 }]}>Private Enrollments</Text>
                    <View style={[styles.badge, { backgroundColor: collaborativePrimary }]}><Text style={[styles.badgeText, { color: colors.white }]}>{routines.filter(r => !r.isPublic).length}</Text></View>
                  </View>
                  {routines
                    .filter(r => !r.isPublic)
                    .filter((routine): routine is Routine => {
                      const lowerSearch = search.toLowerCase();
                      const matchesSearch = !search || routine.routineName?.toLowerCase().includes(lowerSearch) || routine.categoryName?.toLowerCase().includes(lowerSearch);
                      const selectedCat = categories.find(c => c.categoryId === categoryId);
                      const matchesCategory = !categoryId || routine.categoryName === selectedCat?.name;
                      const matchesFreq = !frequencyType || routine.frequencyType?.toLowerCase() === frequencyType.toLowerCase();
                      return matchesSearch && matchesCategory && matchesFreq;
                    })
                    .map((routine, index) => {
                      const accentColor = getCategoryAccentColor(routine.categoryName, null);
                      return (
                        <Animated.View
                          key={routine.id}
                          entering={FadeInDown.delay(index * 80).duration(800).springify().damping(28).stiffness(100)}
                          exiting={FadeOutUp}
                          layout={LinearTransition.springify().damping(28).stiffness(120).duration(650)}
                        >
                          <CollaborativeGroupCard
                            routine={routine}
                            accentColor={accentColor}
                            onPress={handleOpenRoutineView}
                            onLeave={handleLeaveRoutine}
                            onDelete={handleDeleteRoutine}
                            isLeaving={leavingRoutineId === routine.id}
                            isDeleting={deletingRoutineId === routine.id}
                          />
                        </Animated.View>
                      );
                    })}
                </>
              )}
            </>
          )}

          {!loading && routines.length === 0 && (
            <Animated.View entering={FadeInDown.duration(600).springify().damping(20)} style={styles.emptyContainer}>
              <View
                style={{
                  backgroundColor: `${collaborativePrimary}22`,
                  padding: 30,
                  borderRadius: 100,
                  marginBottom: 20,
                }}
              >
                <Ionicons name="people" size={64} color={collaborativePrimary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>No group routines found</Text>
              <Text style={[styles.emptySubText, { color: colors.icon }]}>
                Create a new collaborative list or join your friends&apos; routines to see them
                here!
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[
              styles.createBtn,
              {
                backgroundColor: collaborativePrimary,
                shadowColor: collaborativePrimary
              }
            ]}
            onPress={handleCreateRoutinePress}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={22} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={[styles.createBtnText, { color: colors.white }]}>Create Collaborative List</Text>
          </TouchableOpacity>
        </Animated.ScrollView>

        <LeaveRoutineModal
          visible={isLeaveModalVisible}
          routineName={leavingRoutine?.routineName || ''}
          onClose={() => setIsLeaveModalVisible(false)}
          onConfirm={confirmLeaveRoutine}
          isLoading={leavingRoutineId === leavingRoutine?.id && leavingRoutineId !== null}
        />

        <Toast
          visible={toastVisible}
          message={toastMessage}
          onClose={() => setToastVisible(false)}
        />

        <EliminationModal
          visible={eliminationModalVisible}
          routines={eliminatedRoutineNames}
          onClose={() => setEliminationModalVisible(false)}
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
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 40,
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
  createBtn: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  createBtnText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  filtersWrap: {
    flexDirection: 'row',
    marginBottom: 12,
    zIndex: 3000,
  },
  dropdown: {
    borderRadius: 12,
    minHeight: 42,
    height: 42,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  dropdownContainer: {
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  miniChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  discoveryCard: {
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  discoveryGradient: {
    padding: 16,
  },
  discoveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discoveryTextWrap: {
    flex: 1,
  },
  discoveryTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  discoverySubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  discoveryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
