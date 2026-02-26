import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
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
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Themes & Components
import { getBackgroundGradient } from '@/app/theme';
import { CollaborativeGroupCard } from '@/components/routines/collaborative-group-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
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
  const theme = useColorScheme() ?? 'light';
  const screenGradient = theme === 'dark' ? getBackgroundGradient(theme) : COLLABORATIVE_GRADIENT;

  // 2. State
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
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
        console.error('Failed to load collaborative routines', e);
      } finally {
        setLoading(false);
      }
    },
    [routines.length, showToast],
  );

  const handleTabSwitch = (tab: string) => {
    if (tab !== 'Personal' || isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    requestAnimationFrame(() => {
      router.replace('/(personal)/(drawer)/routines');
      isSwitchingRef.current = false;
    }, 90);
  };

  // 4. Effects
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (message) => {
      setTimeout(() => {
        showToast(message);
      }, 500);
    });
    return () => {
      subscription.remove();
    };
  }, [showToast]);

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
            routines.map((routine, index) => {
              return (
                <Animated.View
                  key={routine.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                >
                  <CollaborativeGroupCard routine={routine} accentColor={COLLABORATIVE_PRIMARY} />
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

          {/* CTA */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(collaborative)/create-routine' as any)}
          >
            <Text style={styles.createBtnText}>Create Collaborative List</Text>
          </TouchableOpacity>
        </ScrollView>

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
});
