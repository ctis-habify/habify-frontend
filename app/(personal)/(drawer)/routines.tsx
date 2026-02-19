import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { BACKGROUND_GRADIENT } from '@/app/theme';
import { CreateRoutineInListModal } from "@/components/modals/create-routine-in-list-modal";
import { RoutineCategoryCard } from '@/components/routines/routine-category-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { Toast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import { mapBackendRoutineToRow } from '@/services/routines.mapper';
import { RoutineList } from '@/types/routine';

export default function RoutinesScreen(): React.ReactElement {
  // 1. Hooks
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();

  // 2. State
  const [lists, setLists] = useState<RoutineList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInList, setShowCreateInList] = useState(false);
  const [selectedRoutineListId, setSelectedRoutineListId] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 3. Callbacks (Memoized)
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
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

  const openCreateInList = useCallback((routineListId: number) => {
    setSelectedRoutineListId(routineListId);
    setShowCreateInList(true);
  }, []);

  const closeCreateInList = useCallback(() => {
    setShowCreateInList(false);
    setSelectedRoutineListId(null);
  }, []);

  const handleRoutinePress = useCallback((id: string) => {
    router.push({
      pathname: '/(personal)/routine/[id]',
      params: { id: id },
    });
  }, [router]);

  const handleEditList = useCallback((id: number, title: string, categoryId: number) => {
    router.push({
      pathname: '/(personal)/create-routine',
      params: { 
        id: id,
        title: title,
        categoryId: categoryId
      }
    });
  }, [router]);

  const handleDeleteList = useCallback((id: number, title: string) => {
    if (!token) return;
    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${title}" and all its routines?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await routineService.deleteRoutineList(id, token);
              showToast("List deleted successfully");
              loadLists(true);
            } catch (err: unknown) {
              console.error("Delete list failed:", err);
              Alert.alert("Error", "Failed to delete list.");
            }
          }
        }
      ]
    );
  }, [token, loadLists, showToast]);

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

  useEffect(() => {
    if (token) loadLists(true);

    const toastSub = DeviceEventEmitter.addListener('SHOW_TOAST', (msg) => {
        showToast(msg);
        loadLists(true);
    });
    
    return () => {
        toastSub.remove();
    };
  }, [token, loadLists, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadLists();    
    }, [loadLists])
  );

  // 5. Render
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

             <View style={{ flex: 1 }}>
                <AnimatedTabSwitcher 
                    tabs={['Personal', 'Collaborative']}
                    activeTab="Personal"
                    onTabPress={(tab) => {
                        if (tab === 'Collaborative') {
                            router.replace('/(collaborative)/(drawer)/routines' as any);
                        }
                    }}
                    activeColor={Colors.light.primary} // Default purple
                />
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
            const routineListIdRaw = (list as any).routineListId ?? (list as any).id ?? list.id;
            const routineListId = Number(routineListIdRaw);
            const canAdd = Number.isFinite(routineListId);

            return (
              <RoutineCategoryCard
                key={`list-${canAdd ? routineListId : index}`}
                tagLabel={list.categoryName}
                title={list.routineListTitle}
                routines={list.routines.map((routine) => ({
                  ...mapBackendRoutineToRow(routine),
                  // Removed redundant onPress, handled by onItemPress
                }))}
                onItemPress={handleRoutinePress}
                onPressAddRoutine={canAdd ? () => openCreateInList(routineListId) : undefined}
                onDeleteList={canAdd ? () => handleDeleteList(routineListId, list.routineListTitle) : undefined}
                onEditList={canAdd ? () => handleEditList(routineListId, list.routineListTitle, list.categoryId) : undefined}
              />
            );
          })
        )}

        {!loading && lists.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>You haven&#39;t created a routine yet.</Text>
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
             closeCreateInList();
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
