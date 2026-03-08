import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DeviceEventEmitter,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Themes & Components
import { getBackgroundGradient } from '@/app/theme';
import { LeaveRoutineModal } from '@/components/modals/leave-routine-modal';
import { CollaborativeGroupCard } from '@/components/routines/collaborative-group-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notification.service';
import { routineService } from '@/services/routine.service';
import { Routine } from '@/types/routine';

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
  const activeTab = 'Collaborative';
  const isSwitchingRef = useRef(false);

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
        // 1. Fetch collaborative routines array as per spec
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
          {/* routines as standalone cards */}
          {loading ? (
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>Loading...</Text>
          ) : (
            routines
              .filter((routine): routine is Routine => !!routine && !!routine.id)
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

          {/* CTAs */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(collaborative)/create-routine' as any)}
          >
            <Text style={styles.createBtnText}>Create Collaborative List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createBtn, styles.browseBtn]}
            onPress={() => router.push('/(collaborative)/(drawer)/browse' as any)}
          >
            <Ionicons name="search-outline" size={16} color={COLLABORATIVE_PRIMARY} style={{ marginRight: 6 }} />
            <Text style={[styles.createBtnText, { color: COLLABORATIVE_PRIMARY }]}>Browse Public Routines</Text>
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
});
