import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { RoutineCategoryCard } from '@/components/routines/RoutineCategoryCard';
import { RoutineRowProps } from '@/components/routines/RoutineRow';
import { Href, useRouter } from 'expo-router';

// Silinsin ve db'den çekilsin
const initialSportRoutines: RoutineRowProps[] = [
  { id: '6815ca3c-32eb-49ff-8c1c-3c9786627160', name: 'Sport Routine 1', durationLabel: '40 Minutes' },
  { id: '2', name: 'Sport Routine 2', durationLabel: '8 Hours' },
  { id: '3', name: 'Sport Routine 3', durationLabel: '20 Minutes' },
  { id: '4', name: 'Sport Routine 4', durationLabel: '2 Hours' },
  { id: '5', name: 'Sport Routine 5', durationLabel: '10 Hours' },
  { id: '6', name: 'Sport Routine 6', durationLabel: '3 Hours' },
];


const initialMusicRoutines: RoutineRowProps[] = [
  { id: '7', name: 'Music Routine 1', durationLabel: '40 Minutes' },
  { id: '8', name: 'Music Routine 2', durationLabel: '8 Hours' },
  { id: '9', name: 'Music Routine 3', durationLabel: '20 Minutes' },
  { id: '10', name: 'Music Routine 4', durationLabel: '2 Hours' },
  { id: '11', name: 'Music Routine 5', durationLabel: '10 Hours' },
  { id: '12', name: 'Music Routine 6', durationLabel: '3 Hours' },
];

export default function RoutinesScreen() {
  const router = useRouter(); // <--- Initialize Router

  // local state for completion tracking
  const [sportRoutines, setSportRoutines] =
    useState<RoutineRowProps[]>(initialSportRoutines);

  const [musicRoutines, setMusicRoutines] =
    useState<RoutineRowProps[]>(initialMusicRoutines);

 // Handle Navigation to Edit Screen
  const handleRoutinePress = (id: string) => {
    router.push(`/(personal)/routine/${id}` as Href);
  };

  // Sport checkbox toggle
  const handleSportToggle = (index: number, value: boolean) => {
    const updated = [...sportRoutines];
    updated[index].completed = value;
    setSportRoutines(updated);
  };

  // Music checkbox toggle
  const handleMusicToggle = (index: number, value: boolean) => {
    const updated = [...musicRoutines];
    updated[index].completed = value;
    setMusicRoutines(updated);
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
        {/* --- Tabs --- */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabTextActive]}>Personal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Collaborative</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
        </View>

        {/* SPORT ROUTINES CARD */}
        <RoutineCategoryCard
          tagLabel="Sport"
          frequencyLabel="Weekly"
          title="Sport Routines"
          routines={sportRoutines}
          showWeekDays={false}
          onRoutineToggle={handleSportToggle}
          onItemPress={handleRoutinePress}
        />

        {/* MUSIC ROUTINES CARD */}
        <RoutineCategoryCard
          tagLabel="Music"
          frequencyLabel="Daily"
          title="Music Routines"
          routines={musicRoutines}
          showWeekDays={true}
          onRoutineToggle={handleMusicToggle}
          onItemPress={handleRoutinePress}
        />

        {/* CREATE BUTTON */}
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(personal)/create-routine')}>
          <Text style={styles.createBtnText}>Create Routine</Text>
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

  tabWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
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
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: '#cbd5f5',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#020617',
    fontWeight: '600',
    fontSize: 14,
  },

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
