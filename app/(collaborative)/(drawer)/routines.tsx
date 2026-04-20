import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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
  const { token } = useAuth();
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [eliminationModalVisible, setEliminationModalVisible] = useState(false);
  const [eliminatedRoutineNames, setEliminatedRoutineNames] = useState<string[]>([]);

  const activeTab = 'Collaborative';
  const isSwitchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animation Setup ──────────────
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
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const loadLists = useCallback(
    async (refresh = false) => {
      if (refresh || routines.length === 0) setLoading(true);
      setIsRefreshing(refresh);
      try {
        const list = await routineService.getCollaborativeRoutines();
        
        // --- Batch Lazy Elimination Cleanup ---
        const eliminatedNames: string[] = [];
        const healthyRoutines = list.filter(r => {
          const health = (r.lives ?? 0) - (r.missedCount ?? 0);
          if (health <= 0) {
            eliminatedNames.push(r.routineName || 'Unnamed Routine');
            // Silent cleanup in background
            routineService.leaveRoutine(r.id).catch(err => 
              console.error(`[Cleanup] Failed to leave routine ${r.id}:`, err)
            );
            return false;
          }
          return true;
        });

        if (eliminatedNames.length > 0) {
          setEliminatedRoutineNames(eliminatedNames);
          setEliminationModalVisible(true);
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
    [routines.length, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      opacity.value = 0;
      translateX.value = 40;
      scale.value = 0.97;

      opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      translateX.value = withSpring(0, ENTER_SPRING);
      scale.value = withSpring(1, ENTER_SPRING);

      loadLists();
    }, [loadLists]),
  );

  const fetchPublicRoutines = useCallback(async (q?: string, catId?: number | '', freq?: string) => {
    setLoadingPublic(true);
    try {
      const data = await routineService.browsePublicRoutines(q || undefined, catId || undefined, freq || undefined);
      setPublicRoutines(data);
    } catch {
      // ignore
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  const handleJoin = useCallback(
    async (id: string) => {
      try {
        const res = await routineService.joinPublicRoutine(id);
        showToast(res.message);
        loadLists(false);
        setPublicRoutines((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isAlreadyMember: true, memberCount: r.memberCount + 1 } : r)),
        );
        DeviceEventEmitter.emit('SHOW_TOAST', 'Successfully joined the routine!');
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to join routine');
      }
    },
    [loadLists, showToast],
  );

  const handleTabSwitch = (tab: string) => {
    if (tab !== 'Personal' || isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => {
      setTimeout(() => {
        router.replace('/(personal)/(drawer)/routines');
        isSwitchingRef.current = false;
      }, 90);
    });
  };

  const handleOpenRoutineView = useCallback(
    (routine: Routine) => {
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
    (routine: Routine) => {
      if (!routine?.id) return;
      setLeavingRoutine(routine);
      setIsLeaveModalVisible(true);
    },
    [],
  );

  const confirmDeleteRoutine = useCallback(async (routine: Routine) => {
    if (!routine.id || !token) return;
    setDeletingRoutineId(routine.id);
    try {
      await routineService.deleteRoutine(routine.id, token);
      showToast('Routine has been deleted.');
      setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not delete the routine. Please try again.';
      showToast(message);
    } finally {
      setDeletingRoutineId(null);
    }
  }, [showToast, token]);

  const handleDeleteRoutine = useCallback(
    (routine: Routine) => {
      if (!routine?.id) return;
      confirmDeleteRoutine(routine);
    },
    [confirmDeleteRoutine],
  );

  const confirmLeaveRoutine = useCallback(async () => {
    if (!leavingRoutine?.id) return;
    setLeavingRoutineId(leavingRoutine.id);
    try {
      await routineService.leaveRoutine(leavingRoutine.id);
      showToast('You have left the routine.');
      setRoutines((prev) => prev.filter((r) => r.id !== leavingRoutine.id));
      setPublicRoutines((prev) =>
        prev.map(r => r.id === leavingRoutine.id ? { ...r, isAlreadyMember: false, memberCount: Math.max(0, r.memberCount - 1) } : r)
      );
    } catch (err: unknown) {
      const message =
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

  // Debounced search logic for global results is removed as per user request to only filter joined routines.


  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (message: string) => {
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

  // Focus re-trigger is handled by useFocusEffect at the top

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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(collaborative)/(drawer)/browse');
            }}
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

          {/* Filters & Search Integrated */}
          <View style={[styles.filtersWrap, { ...(Platform.OS === 'ios' && { zIndex: 3000 }) }]}>
            <View style={{ flex: 1, marginRight: 8, ...(Platform.OS === 'ios' && { zIndex: 3000 }) }}>
              <DropDownPicker
                open={categoryOpen}
                value={categoryId}
                items={[{ label: 'All Categories', value: '' }, ...categories.map(c => ({ label: c.name, value: c.categoryId }))] as { label: string; value: string | number }[]}
                setOpen={setCategoryOpen}
                setValue={setCategoryId as React.Dispatch<React.SetStateAction<number | "">>}
                theme={isDark ? "DARK" : "LIGHT"}
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)' }]}
                placeholder={loadingCategories ? "Loading..." : "Category"}
                placeholderStyle={{ color: colors.icon, fontSize: 12, opacity: 0.6 }}
                textStyle={{ color: colors.text, fontSize: 12 }}
                labelStyle={{ fontWeight: '600' }}
                listMode="SCROLLVIEW"
                zIndex={3000}
                zIndexInverse={1000}
                onOpen={() => setFrequencyOpen(false)}
              />
            </View>
            <View style={{ flex: 1, ...(Platform.OS === 'ios' && { zIndex: 2000 }) }}>
              <DropDownPicker
                open={frequencyOpen}
                value={frequencyType}
                items={[
                  { label: 'Any Frequency', value: '' },
                  { label: 'Daily', value: 'Daily' },
                  { label: 'Weekly', value: 'Weekly' }
                ] as { label: string; value: string }[]}
                setOpen={setFrequencyOpen}
                setValue={setFrequencyType as React.Dispatch<React.SetStateAction<string | null>>}
                theme={isDark ? "DARK" : "LIGHT"}
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)' }]}
                placeholder="Frequency"
                placeholderStyle={{ color: colors.icon, fontSize: 12, opacity: 0.6 }}
                textStyle={{ color: colors.text, fontSize: 12 }}
                labelStyle={{ fontWeight: '600' }}
                listMode="SCROLLVIEW"
                zIndex={2000}
                zIndexInverse={2000}
                onOpen={() => setCategoryOpen(false)}
              />
            </View>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.icon} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search your routines…"
              placeholderTextColor={colors.icon}

              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>



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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/(collaborative)/create-routine');
            }}
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyResultsText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
});
