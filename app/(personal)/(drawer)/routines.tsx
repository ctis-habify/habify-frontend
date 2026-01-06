import { BACKGROUND_GRADIENT } from '@/app/theme';
import CreateRoutineInListModal from '@/components/modals/CreateRoutineInListModal';
import { RoutineCategoryCard } from '@/components/routines/RoutineCategoryCard';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/theme';
import { routineService } from '@/services/routine.service';
import { mapBackendRoutineToRow } from '@/services/routines.mapper';
import { RoutineList } from '@/types/routine';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
// ... (imports)
import {
    DeviceEventEmitter,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// ... existing imports

// ... imports
import { useAuth } from '@/hooks/useAuth';

// ... imports

export default function RoutinesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth(); // Get token

  const [lists, setLists] = useState<RoutineList[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SHOW_TOAST', (message) => {
        // Add a small delay to ensure navigation/focus transition settles
        setTimeout(() => {
            showToast(message);
        }, 500);
    });
    return () => {
        subscription.remove();
    };
  }, []);
    
  const loadLists = useCallback(async (showLoading = false) => {
    if (showLoading || lists.length === 0) setLoading(true);
    try {
      const data = await routineService.getGroupedRoutines(token || undefined);
      setLists(data);
    } catch (e) {
      console.error("Failed to load routines", e);
    } finally {
      setLoading(false);
    }
  }, [token, lists.length]);

  const [showCreateInList, setShowCreateInList] = useState(false);
  const [selectedRoutineListId, setSelectedRoutineListId] = useState<number | null>(null);

  const openCreateInList = (routineListId: number) => {
    setSelectedRoutineListId(routineListId);
    setShowCreateInList(true);
  };

  const closeCreateInList = () => {
    setShowCreateInList(false);
    setSelectedRoutineListId(null);
  };

  useEffect(() => {
    if (token) loadLists(true);
  }, [token, loadLists]);

  useFocusEffect(
    useCallback(() => {
      loadLists();    
    }, [loadLists])
  );
  const handleRoutinePress = (id: string) => {
    router.push({
      pathname: '/(personal)/routine/[id]',
      params: { id: id },
    });
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
       {/* FIXED HEADER SECTION */}
       <View style={styles.fixedHeader}>
          <View style={styles.headerTopRow}>
             <TouchableOpacity 
                style={styles.menuBtn} 
                onPress={() => (navigation as any).dispatch(DrawerActions.toggleDrawer())}
              >
                <Ionicons name="menu" size={24} color="#fff" />
             </TouchableOpacity>

             <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, styles.tabActive]}>
                  <Text style={styles.tabTextActive}>Personal</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.tab}>
                  <Text style={styles.tabText}>Collaborative</Text>
                </TouchableOpacity>
             </View>
          </View>

          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => router.push('/(personal)/(drawer)/today-routines')}
          >
            <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
          </TouchableOpacity>
       </View>

       <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* lists */}
        {loading ? (
          <Text style={{ color: '#fff', textAlign: 'center' }}>Loading...</Text>
        ) : (
          lists.map((list, index) => {
            // routineListId'yi MAP içinde hesapla
            const routineListIdRaw = (list as any).routineListId ?? (list as any).id ?? list.id;
            const routineListId = Number(routineListIdRaw);
            const canAdd = Number.isFinite(routineListId);

            return (
              <RoutineCategoryCard
                key={`list-${canAdd ? routineListId : index}`}
                tagLabel={list.categoryName}       // sol üst: sadece kategori adı
                title={list.routineListTitle}      // sağ üst: liste adı
                routines={list.routines.map((routine) => ({
                  ...mapBackendRoutineToRow(routine),
                  onPress: () => handleRoutinePress(routine.id),
                }))}
                onItemPress={handleRoutinePress}
                // + butonu için handler (id yoksa buton görünmez)
                onPressAddRoutine={canAdd ? () => openCreateInList(routineListId) : undefined}
              />
            );
          })
        )}

        {!loading && lists.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>You haven't created a routine yet.</Text>
            <Text style={styles.emptySubText}>
              You can create a new list by clicking the button below.
            </Text>
          </View>
        )}

        {/* Modal */}
        <CreateRoutineInListModal
          visible={showCreateInList}
          routineListId={selectedRoutineListId}
          onClose={closeCreateInList}
          onCreated={async () => {
             // Close handled inside closeCreateInList which is called by Modal's onClose, 
             // but here we just want to refresh and show toast.
             // Wait, the modal calls onClose immediately after onCreated in my previous edit?
             // Actually, in CreateRoutineInListModal, onCreated is called, then onClose.
             // Here, onClose is passed as prop. 
             // In the modal:
             // onCreated?.();
             // onClose();
             
             // So here:
             closeCreateInList(); // Ensure state update
             await loadLists(true);
             showToast("Routine created successfully!");
          }}
        />

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(personal)/create-routine')}
        >
          <Text style={styles.createBtnText}>Create Routine List</Text>
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

  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '400' },
  tabTextActive: { color: Colors.light.primary, fontWeight: '400' },
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
