'use client';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoutines } from '../../hooks/useRoutines';
import { RoutineList } from '../../types/routine';
import { BACKGROUND_GRADIENT, COLORS } from '../theme';

export default function RoutinesScreen() {
  const router = useRouter();
  const { routineLists, isLoading, fetchRoutineLists } = useRoutines();

  useEffect(() => {
    fetchRoutineLists();
  }, [fetchRoutineLists]);

  const handleCreateRoutine = () => {
    router.push('/(personal)/create-routine');
  };

  const renderRoutineItem = ({ item }: { item: RoutineList }) => (
    <View style={styles.routineItem}>
      <Text style={styles.routineTitle}>{item.title}</Text>
      <Text style={styles.routineDate}>
        Created: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT as any} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Routines</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateRoutine}
          disabled={isLoading}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : routineLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ffffff99" />
          <Text style={styles.emptyText}>No routines yet</Text>
          <Text style={styles.emptySubtext}>Create your first routine to get started</Text>
          <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateRoutine}>
            <Text style={styles.createFirstButtonText}>Create Routine</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routineLists}
          renderItem={renderRoutineItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.inputBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#ffffff99',
    textAlign: 'center',
    marginBottom: 30,
  },
  createFirstButton: {
    backgroundColor: COLORS.inputBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  routineItem: {
    backgroundColor: COLORS.formBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  routineDate: {
    fontSize: 14,
    color: '#6b7280',
  },
});
