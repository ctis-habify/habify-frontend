import CreateRoutineInListModal from '@/components/modals/CreateRoutineInListModal';
import { RoutineCategoryCard } from '@/components/routines/RoutineCategoryCard';
import { routineService } from '@/services/routine.service';
import { mapBackendRoutineToRow } from '@/services/routines.mapper';
import { RoutineList } from '@/types/routine';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
export default function RoutinesScreen() {
  const router = useRouter();

  const [lists, setLists] = useState<RoutineList[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await routineService.getGroupedRoutines();
      setLists(data);
    } catch (e) {
      console.error("Failed to load routines", e);
    } finally {
      setLoading(false);
    }
  }, []);
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

  const refreshLists = async () => {
    setLoading(true);
    try {
      const data = await routineService.getGroupedRoutines();
      console.log('getGroupedRoutines:', JSON.stringify(data, null, 2));
      setLists(data);
    } catch (e) {
      console.error('Failed to load routines', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLists();
  }, []);

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
    <LinearGradient colors={['#031138', '#02162f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* tabs */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={styles.tabTextActive}>Personal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Collaborative</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* today link */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => router.push('/(personal)/today-routines')}
        >
          <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
        </TouchableOpacity>

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

        {/* Modal */}
        <CreateRoutineInListModal
          visible={showCreateInList}
          routineListId={selectedRoutineListId}
          onClose={closeCreateInList}
          onCreated={async () => {
            closeCreateInList();
            await refreshLists();
          }}
        />

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/(personal)/create-routine')}
        >
          <Text style={styles.createBtnText}>Create Routine List</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 40,
  },
  tabWrapper: { alignItems: 'center', marginBottom: 20 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1d3a80',
    borderRadius: 24,
    padding: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 26,
    borderRadius: 20,
  },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { color: '#cbd5f5', fontWeight: '600' },
  tabTextActive: { color: '#020617', fontWeight: '600' },
  sectionHeader: {
    backgroundColor: '#0b2a73',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: '#001b4f',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
