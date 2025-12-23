import { RoutineCategoryCard } from '@/components/routines/RoutineCategoryCard';
import { routineService } from '@/services/routine.service';
import { mapBackendRoutineToRow } from '@/services/routines.mapper';
import { RoutineList } from '@/types/routine';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from "expo-router";
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

  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
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

        {/* <Text style={styles.category}>{routine.categoryName}</Text> */}
        {loading ? (
          <Text style={{ color: '#fff', textAlign: 'center' }}>Loading...</Text>
        ) : (
          lists.map((list, index) => {
            // key garanti string olsun, id yoksa index fallback
            const key = list.id ?? list.categoryId ?? index;
            console.log("BACKEND TITLE: ", list.routineListTitle);
            return (
              <RoutineCategoryCard
              key={`list-${(list as any).routineListId}`}                
              tagLabel={list.categoryName}
                title={list.routineListTitle}
                routines={list.routines.map((routine) => ({
                  ...mapBackendRoutineToRow(routine),
                  onPress: () => handleRoutinePress(routine.id),
                }))}
                onItemPress={handleRoutinePress} />
            );
          })
        )}

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
  // category: {
  //   backgroundColor: '#2663F6',
  //   color: '#fff',
  //   fontWeight: '700',
  //   paddingHorizontal: 10,
  //   paddingVertical: 4,
  //   borderRadius: 12,
  //   marginBottom: 6,
  //   alignSelf: 'flex-start',
  // },
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
