import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { RoutineCategoryCard } from '@/components/routines/RoutineCategoryCard';
import { routineService } from '@/services/routine.service';
import {
  mapBackendRoutineToRow
} from '@/services/routines.mapper';
import { RoutineList } from '@/types/routine';
import { Href, useRouter } from 'expo-router';

export default function RoutinesScreen() {
  const router = useRouter();

  const [lists, setLists] = useState<RoutineList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await routineService.getGroupedRoutines();
        setLists(data);
        console.log('Fetched routines:', data);
        // console.log('Mapped routines:', data.map((list) => list.routines.map(mapBackendRoutineToRow)));
        console.log('Routine Name: ', data[0]?.routines[0]?.routineName);
      } catch (e) {
        console.error('Failed to load routines', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoutinePress = (id: string) => {
    router.push(`/(personal)/routine/${id}` as Href);
  };

  return (
    <LinearGradient
      colors={['#031138', '#02162f']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
        </View>

        {loading ? (
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            Loading...
          </Text>
        ) : (
          lists.map((list) => {
            const frequencyType =
              list.routines[3]?.frequencyType ?? 'DAILY';

            return (
              <RoutineCategoryCard
                key={list.id}
                tagLabel={list.categoryName}
                frequencyLabel={
                  frequencyType === 'DAILY' ? 'Daily' : 'Weekly'
                }
                title={list.title}
                showWeekDays={frequencyType === 'daily'}
                routines={list.routines.map(mapBackendRoutineToRow)}
                onItemPress={handleRoutinePress}
              />
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