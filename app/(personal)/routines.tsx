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


const initialSportRoutines: RoutineRowProps[] = [
  { name: 'Sport Routine 1', durationLabel: '40 Minutes' },
  { name: 'Sport Routine 2', durationLabel: '8 Hours' },
  { name: 'Sport Routine 3', durationLabel: '20 Minutes' },
  { name: 'Sport Routine 4', durationLabel: '2 Hours' },
  { name: 'Sport Routine 5', durationLabel: '10 Hours' },
  { name: 'Sport Routine 6', durationLabel: '3 Hours' },
];


const initialMusicRoutines: RoutineRowProps[] = [
  { name: 'Music Routine 1', durationLabel: '40 Minutes' },
  { name: 'Music Routine 2', durationLabel: '8 Hours' },
  { name: 'Music Routine 3', durationLabel: '20 Minutes' },
  { name: 'Music Routine 4', durationLabel: '2 Hours' },
  { name: 'Music Routine 5', durationLabel: '10 Hours' },
  { name: 'Music Routine 6', durationLabel: '3 Hours' },
];

export default function RoutinesScreen() {
  // local state for completion tracking
  const [sportRoutines, setSportRoutines] =
    useState<RoutineRowProps[]>(initialSportRoutines);

  const [musicRoutines, setMusicRoutines] =
    useState<RoutineRowProps[]>(initialMusicRoutines);

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
        />

        {/* MUSIC ROUTINES CARD */}
        <RoutineCategoryCard
          tagLabel="Music"
          frequencyLabel="Daily"
          title="Music Routines"
          routines={musicRoutines}
          showWeekDays={true}
          onRoutineToggle={handleMusicToggle}
        />

        {/* CREATE BUTTON */}
        <TouchableOpacity style={styles.createBtn}>
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
