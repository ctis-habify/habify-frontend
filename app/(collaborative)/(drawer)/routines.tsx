import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Platform,
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
import { getBackgroundGradient } from '@/app/theme';
import { LeaveRoutineModal } from '@/components/modals/leave-routine-modal';
import { CollaborativeGroupCard } from '@/components/routines/collaborative-group-card';
import { PublicRoutineCard } from '@/components/routines/public-routine-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { categoryService } from '@/services/category.service';
import { notificationService } from '@/services/notification.service';
import { routineService } from '@/services/routine.service';
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

  // 2. State
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [leavingRoutineId, setLeavingRoutineId] = useState<string | null>(null);
  const [leavingRoutine, setLeavingRoutine] = useState<Routine | null>(null);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  
  // Public Search State
  const [publicRoutines, setPublicRoutines] = useState<PublicRoutine[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [frequencyType, setFrequencyType] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
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

  const getErrorMessage = useCallback((error: unknown): string => {
    const fallback = 'Failed to load collaborative routines.';

    if (!error || typeof error !== 'object') {
      return fallback;
    }

    const err = error as {
      message?: string;
      response?: {
        data?: {
          message?: string | string[];
          error?: string;
        };
        status?: number;
      };
    };

    const responseMessage = err.response?.data?.message;
    const normalizedResponseMessage = Array.isArray(responseMessage)
      ? responseMessage[0]
      : responseMessage;
    const message = String(normalizedResponseMessage || err.response?.data?.error || err.message || '').trim();
    const lower = message.toLowerCase();

    if (lower.includes('network')) {
      return 'Network issue. Check your connection and backend URL.';
    }
    if (lower.includes('unauthorized') || err.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (message) {
      return message;
    }
    return fallback;
  }, []);

  const loadLists = useCallback(
    async (showLoading = false) => {
      if (showLoading || routines.length === 0) setLoading(true);
      try {
        const data = await routineService.getCollaborativeRoutines();
        setRoutines(data);

        const socialReminder = notificationService.getSocialInteractionReminder(data.length);
        if (socialReminder) showToast(socialReminder);
      } catch (e) {
        showToast(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [getErrorMessage, routines.length, showToast, token],
  );

  const fetchPublicRoutines = useCallback(async (q?: string, catId?: number | '', freq?: string) => {
    setLoadingPublic(true);
    try {
      const data = await routineService.browsePublicRoutines(q || undefined, catId || undefined, freq || undefined);
      setPublicRoutines(data);
    } catch (e) {
      console.error('Failed to load public routines', e);
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
      } catch (err: any) {
        showToast(err.message ?? 'Failed to join routine');
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
        pathname: '/(collaborative)/routine/[id]',
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
          user_id: routine.creatorId || routine.user_id || (routine as any).userId || '',
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
      } catch (e) {
        console.warn('Failed to load categories', e);
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
              onPress={() => (navigation as any).dispatch(DrawerActions.toggleDrawer())}
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

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Filters & Search Integrated */}
          <View style={[styles.filtersWrap, { ...(Platform.OS === 'ios' && { zIndex: 3000 }) }]}>
            <View style={{ flex: 1, marginRight: 8, ...(Platform.OS === 'ios' && { zIndex: 3000 }) }}>
              <DropDownPicker
                open={categoryOpen}
                value={categoryId}
                items={[{ label: 'All Categories', value: '' }, ...categories.map(c => ({ label: c.name, value: c.categoryId ?? c.id }))] as any}
                setOpen={setCategoryOpen}
                setValue={setCategoryId as any}
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
                ] as any}
                setOpen={setFrequencyOpen}
                setValue={setFrequencyType as any}
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
                publicRoutines.map((item, index) => (
                  <Animated.View key={`public-${item.id}`} entering={FadeInDown.delay(index * 50)}>
                    <PublicRoutineCard 
                      routine={item} 
                      index={index} 
                      accentColor={COLLABORATIVE_PRIMARY} 
                      onJoin={handleJoin} 
                    />
                  </Animated.View>
                ))
              ) : !loadingPublic ? (
                <Text style={styles.emptyResultsText}>No routines match your filters.</Text>
              ) : null}
            </View>
          ) : null}

          {/* Section: My Joined Routines */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Routines</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLLABORATIVE_PRIMARY} style={{ marginTop: 20 }} />
          ) : (
            routines
              .filter((routine): routine is Routine => {
                if (!routine || !routine.id) return false;
                if (!search) return true;
                const lowerSearch = search.toLowerCase();
                const nameMatch = routine.routineName?.toLowerCase().includes(lowerSearch);
                const categoryMatch = routine.categoryName?.toLowerCase().includes(lowerSearch);
                return !!(nameMatch || categoryMatch);
              })
              .map((routine, index) => {
                return (
                  <Animated.View
                    key={routine.id}
                    entering={FadeInDown.delay(index * 100).springify()}
                  >
                    <CollaborativeGroupCard
                      routine={routine}
                      accentColor={COLLABORATIVE_PRIMARY}
                      onPress={handleOpenRoutineView}
                      onLeave={handleLeaveRoutine}
                      isLeaving={leavingRoutineId === routine.id}
                    />
                  </Animated.View>
                );
              })
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
            onPress={() => router.push('/(collaborative)/create-routine' as any)}
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
  browseBtn: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    borderColor: 'rgba(232, 121, 249, 0.35)',
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
});
