import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    DeviceEventEmitter,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Themes & Components
import { CollaborativeGroupCard } from '@/components/routines/collaborative-group-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/use-auth';
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

  // 2. State
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 3. Callbacks (Memoized)
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const loadLists = useCallback(async (showLoading = false) => {
    if (showLoading || routines.length === 0) setLoading(true);
    try {
      // 1. Fetch collaborative routines array as per spec
      const data = await routineService.getCollaborativeRoutines();
      setRoutines(data);
    } catch (e) {
      console.error("Failed to load collaborative routines", e);
    } finally {
      setLoading(false);
    }
  }, [token, routines.length]);

  // Tab Switch Handler
  const handleTabSwitch = (tab: string) => {
      if (tab === 'Personal') {
          router.replace('/(personal)/(drawer)/routines');
      }
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
    }, [loadLists])
  );

  // 5. Render
  return (
    <LinearGradient colors={COLLABORATIVE_GRADIENT} style={styles.container}>
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
                    activeTab="Collaborative"
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
                  <CollaborativeGroupCard
                    routine={routine}
                    accentColor={COLLABORATIVE_PRIMARY}
                  />
              </Animated.View>
            );
          })
        )}

        {!loading && routines.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={{ backgroundColor: 'rgba(232, 121, 249, 0.1)', padding: 30, borderRadius: 100, marginBottom: 20 }}>
                 <Ionicons name="people" size={64} color={COLLABORATIVE_PRIMARY} />
            </View>
            <Text style={styles.emptyText}>No group routines found</Text>
            <Text style={styles.emptySubText}>
              Create a new collaborative list or join your friends' routines to see them here!
            </Text>
          </View>
        )}

         {/* routines as standalone cards */}

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
  sectionHeader: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
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
