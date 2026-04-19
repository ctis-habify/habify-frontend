import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
  RefreshControl,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Themes & Components
import { LeaveRoutineModal } from '@/components/modals/leave-routine-modal';
import { CollaborativeGroupCard } from '@/components/routines/collaborative-group-card';
import { CollaborativeScoreBanner } from '@/components/routines/collaborative-score-banner';
import { PublicRoutineCard } from '@/components/routines/public-routine-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
import { getCategoryAccentColor } from '@/constants/category-colors';
import { getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCollaborativeScore } from '@/hooks/use-collaborative-score';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { categoryService } from '@/services/category.service';
import { notificationService } from '@/services/notification.service';
import { routineService } from '@/services/routine.service';
import { Category } from '@/types/category';
import { PublicRoutine, Routine } from '@/types/routine';

// Collaborative Theme Constants
const COLLABORATIVE_GRADIENT = ['#2e1065', '#581c87'] as const; // Violet-950 -> Violet-900
const COLLABORATIVE_PRIMARY = '#E879F9'; // Fuchsia-400

export default function CollaborativeRoutinesScreen(): React.ReactElement {
  // 1. Hooks
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const screenGradient = theme === 'dark' ? getBackgroundGradient(theme) : COLLABORATIVE_GRADIENT;
  const {
    points: collabPoints,
    streak: collabStreak,
    nextBonusStreak,
    nextBonusPoints,
    rank: collabRank,
    loading: collabScoreLoading,
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

  const activeTab = 'Collaborative';
  const isSwitchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const translateXAnim = useRef(new RNAnimated.Value(-14)).current;
  const scaleAnim = useRef(new RNAnimated.Value(0.985)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateXAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        stiffness: 160,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateXAnim]);

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
        // Newest routines first (assuming backend returns oldest first)
        setRoutines([...list].reverse());
        const socialReminder = notificationService.getSocialInteractionReminder(list.length);
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
        // Refresh local routines since user joined a new one
        loadLists(false);
        // Update public outcomes locally
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
      // Also update public list if visible
      setPublicRoutines((prev) => 
        prev.map(r => r.id === leavingRoutine.id ? { ...r, isAlreadyMember: false, memberCount: Math.max(0, r.memberCount - 1) } : r)
      );
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Could not leave the routine. Please try again.';
      showToast(message);
      throw err; // Re-throw to inform modal that it failed
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

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search.trim() || categoryId || frequencyType) {
        fetchPublicRoutines(search.trim(), categoryId, frequencyType);
      } else {
        setPublicRoutines([]);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, categoryId, frequencyType, fetchPublicRoutines]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (message) => {
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

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists]),
  );

  // 5. Render
  return (
    <RNAnimated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        backgroundColor: screenGradient[0],
        transform: [{ translateX: translateXAnim }, { scale: scaleAnim }],
      }}
    >
      <LinearGradient colors={screenGradient} style={styles.container}>
        {/* FIXED HEADER SECTION */}
        <View style={styles.fixedHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AnimatedTabSwitcher
                tabs={['Personal', 'Collaborative']}
                activeTab={activeTab}
                onTabPress={handleTabSwitch}
                activeColor={COLLABORATIVE_PRIMARY}
              />
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadLists(true)}
              tintColor={COLLABORATIVE_PRIMARY}
              colors={[COLLABORATIVE_PRIMARY]}
            />
          }
        >
          {/* Collaborative Score Banner (FReq 5.5, 5.7, 5.8) */}
          <CollaborativeScoreBanner
            points={collabPoints}
            streak={collabStreak}
            nextBonusStreak={nextBonusStreak}
            nextBonusPoints={nextBonusPoints}
            rank={collabRank}
            loading={collabScoreLoading}
            accentColor={COLLABORATIVE_PRIMARY}
          />

          {/* Discovery Entry Point */}
          <TouchableOpacity 
            style={styles.discoveryCard}
            onPress={() => router.push('/(collaborative)/(drawer)/browse')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(232, 121, 249, 0.15)', 'rgba(232, 121, 249, 0.05)']}
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
                  <Ionicons name="search" size={20} color={COLLABORATIVE_PRIMARY} />
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
                theme="DARK"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder={loadingCategories ? "Loading..." : "Category"}
                placeholderStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                textStyle={{ color: '#fff', fontSize: 12 }}
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
                theme="DARK"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Frequency"
                placeholderStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                textStyle={{ color: '#fff', fontSize: 12 }}
                labelStyle={{ fontWeight: '600' }}
                listMode="SCROLLVIEW"
                zIndex={2000}
                zIndexInverse={2000}
                onOpen={() => setCategoryOpen(false)}
              />
            </View>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter Public Routines…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Section: Public Search Results (Visible when searching/filtering) */}
          {(search.trim() || categoryId || frequencyType) ? (
            <View style={{ marginBottom: 20 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Global Results</Text>
                {loadingPublic && <ActivityIndicator size="small" color={COLLABORATIVE_PRIMARY} />}
              </View>
              {publicRoutines.length > 0 ? (
                publicRoutines.map((item, index) => {
                  const accentColor = getCategoryAccentColor(item.category, item.categoryId ?? null);
                  return (
                    <Animated.View key={`public-${item.id}`} entering={FadeInDown.delay(index * 50)}>
                      <PublicRoutineCard 
                        routine={item} 
                        index={index} 
                        accentColor={accentColor} 
                        onJoin={handleJoin} 
                      />
                    </Animated.View>
                  );
                })
              ) : !loadingPublic ? (
                <Text style={styles.emptyResultsText}>No routines match your filters.</Text>
              ) : null}
            </View>
          ) : null}

          {/* Section: My Joined Routines */}
          {!loading && routines.length > 0 && (
            <>
              {/* Public Enrollments */}
              {routines.some(r => r.isPublic) && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Public Enrollments</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>{routines.filter(r => r.isPublic).length}</Text></View>
                  </View>
                  {routines
                    .filter(r => r.isPublic)
                    .filter((routine): routine is Routine => {
                      if (!search) return true;
                      const lowerSearch = search.toLowerCase();
                      return !!(routine.routineName?.toLowerCase().includes(lowerSearch) || routine.categoryName?.toLowerCase().includes(lowerSearch));
                    })
                    .map((routine, index) => {
                      const accentColor = getCategoryAccentColor(routine.categoryName, null);
                      return (
                        <Animated.View key={routine.id} entering={FadeInDown.delay(index * 50)}>
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
                    <Text style={styles.sectionTitle}>Private Enrollments</Text>
                    <View style={styles.badge}><Text style={styles.badgeText}>{routines.filter(r => !r.isPublic).length}</Text></View>
                  </View>
                  {routines
                    .filter(r => !r.isPublic)
                    .filter((routine): routine is Routine => {
                      if (!search) return true;
                      const lowerSearch = search.toLowerCase();
                      return !!(routine.routineName?.toLowerCase().includes(lowerSearch) || routine.categoryName?.toLowerCase().includes(lowerSearch));
                    })
                    .map((routine, index) => {
                      const accentColor = getCategoryAccentColor(routine.categoryName, null);
                      return (
                        <Animated.View key={routine.id} entering={FadeInDown.delay(index * 50)}>
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
            <View style={styles.emptyContainer}>
              <View
                style={{
                  backgroundColor: 'rgba(232, 121, 249, 0.1)',
                  padding: 30,
                  borderRadius: 100,
                  marginBottom: 20,
                }}
              >
                <Ionicons name="people" size={64} color={COLLABORATIVE_PRIMARY} />
              </View>
              <Text style={styles.emptyText}>No group routines found</Text>
              <Text style={styles.emptySubText}>
                Create a new collaborative list or join your friends&apos; routines to see them
                here!
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(collaborative)/create-routine')}
          >
            <Text style={styles.createBtnText}>Create Collaborative List</Text>
          </TouchableOpacity>
        </ScrollView>

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
          onHide={() => setToastVisible(false)}
        />
      </LinearGradient>
    </RNAnimated.View>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.7)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    minHeight: 38,
    height: 38,
    paddingHorizontal: 10,
  },
  dropdownContainer: {
    backgroundColor: '#1e1b4b',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyResultsText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: COLLABORATIVE_PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discoveryCard: {
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.2)',
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  discoveryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 121, 249, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
