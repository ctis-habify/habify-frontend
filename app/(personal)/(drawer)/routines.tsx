import { getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, DeviceEventEmitter, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// UI
import { CreateRoutineInListModal } from '@/components/modals/create-routine-in-list-modal';
import { CreateRoutineModal } from '@/components/modals/create-routine-modal';
import { RoutineCategoryCard } from '@/components/routines/routine-category-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { getCategoryAccentColor } from '@/constants/category-colors';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import type { RoutineList } from '@/types/routine';

const PERSONAL_GRADIENT = ['#4c1d95', '#7c3aed'] as const;
const PERSONAL_PRIMARY = '#f9a8ff';
const TOKEN_KEY = 'habify_access_token';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export default function PersonalRoutinesScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useColorScheme() ?? 'light';
  const { token: authContextToken } = useAuth();
  
  const screenGradient = theme === 'dark' ? getBackgroundGradient(theme) : PERSONAL_GRADIENT;
  const activeTab = 'Personal';
  const isSwitchingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [routineLists, setRoutineLists] = useState<RoutineList[]>([]);
  const [selectedListForNewRoutine, setSelectedListForNewRoutine] = useState<{ listId: number; categoryId?: number | null } | null>(null);
  const [editListParams, setEditListParams] = useState<{ listId: number; title: string; categoryId?: number } | null>(null);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      // Use token from context first, fall back to SecureStore only if needed
      const t = authContextToken || await getToken();
      

      if (t) {
        const lists = await routineService.getGroupedRoutines(t);
        setRoutineLists(lists);
      }
    } catch (e: unknown) {
      console.error('Error loading personal routine lists:', e);
      const msg = e instanceof Error ? e.message : 'Failed to load routines.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [authContextToken]);

  useEffect(() => {
    loadLists();
    
    // Refresh listener for when returning from edit/create screens
    const sub = DeviceEventEmitter.addListener('refreshPersonalRoutines', () => {
      loadLists();
    });
    return () => sub.remove();
  }, [loadLists]);

  const handleTabSwitch = (tab: string) => {
    if (tab !== 'Collaborative' || isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    setTimeout(() => {
      router.replace('/(collaborative)/(drawer)/routines');
      isSwitchingRef.current = false;
    }, 90);
  };

  const handleAddRoutine = (listId: string | number, categoryId?: number | null) => {

    if (!listId) {
      Alert.alert('Error', 'Routine List ID is missing or null.');
      return;
    }
    setSelectedListForNewRoutine({ listId: Number(listId), categoryId });
  };

  const handleEditList = (list: RoutineList) => {

    const listId = list.id ?? (list as RoutineList & { routineListId?: number }).routineListId;
    if (!listId) return;
    setEditListParams({
      listId: Number(listId),
      title: list.routineListTitle || list.categoryName || '',
      categoryId: list.categoryId || undefined,
    });
  };

  const handleDeleteList = (list: RoutineList) => {
    const listId = list.id ?? (list as RoutineList & { routineListId?: number }).routineListId;
    if (!listId) return;

    if (list.routines && list.routines.length > 0) {
      Alert.alert('Cannot Delete', 'This list contains routines. Please delete or move them first.');
      return;
    }

    Alert.alert('Delete List', 'Are you sure you want to delete this empty list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const t = await getToken();
            if (!t) return;
            await routineService.deleteRoutineList(Number(listId), t);
            loadLists();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete list.';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const handlePressRoutine = (routineId: string) => {
    router.push({ pathname: '/(personal)/routine/[id]', params: { id: routineId } });
  };

  const hasNoData = !loading && routineLists.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: screenGradient[0] }}>
      <LinearGradient colors={screenGradient} style={styles.container}>
        {/* HEADER */}
        <View style={styles.fixedHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <AnimatedTabSwitcher
                tabs={['Personal', 'Collaborative']}
                activeTab={activeTab}
                onTabPress={handleTabSwitch}
                activeColor={PERSONAL_PRIMARY}
              />
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Today's Routines' Header */}
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.85}
            onPress={() => router.push('/(personal)/(drawer)/today-routines')}
          >
            <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />}

          {!loading && routineLists.map((list, idx) => {
            const accentColor = getCategoryAccentColor(list.categoryName, list.categoryId ?? null);

            const routinesProps = (list.routines || []).map(r => ({
              id: r.id,
              name: r.routineName || r.title,
              durationLabel: r.remainingLabel || 'Pending',
              completed: r.isCompleted || r.isDone,
              failed: r.isFailed,
              startTime: r.startTime,
              endTime: r.endTime,
              frequencyType: r.frequencyType,
              categoryName: r.categoryName,
              streak: r.streak,
              missedCount: r.missedCount,
              collaborativeKey: r.collaborativeKey,
              creatorId: r.creatorId,
            }));

            return (
              <RoutineCategoryCard
                key={`list-${list.id ?? idx}-${idx}`}
                title={list.routineListTitle || list.categoryName || 'List'}
                subtitle={`${list.routines?.length || 0} routines`}
                categoryName={list.categoryName}
                routines={routinesProps}
                onItemPress={handlePressRoutine}
                onPressAddRoutine={() => handleAddRoutine(list.id ?? (list as RoutineList & { routineListId?: number }).routineListId, list.categoryId)}
                onEditList={() => handleEditList(list)}
                onDeleteList={() => handleDeleteList(list)}
                accentColor={accentColor}
                variant="light"
              />
            );
          })}

          {hasNoData && (
            <View style={styles.emptyOuter}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="calendar-outline" size={64} color={PERSONAL_PRIMARY} />
              </View>
              <Text style={styles.emptyTitle}>You haven&apos;t created a routine yet.</Text>
              <Text style={styles.emptySub}>
                You can create a new list by clicking the button below.
              </Text>

              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/(personal)/create-routine')}
              >
                <Text style={styles.createBtnText}>Create Routine List</Text>
              </TouchableOpacity>
            </View>
          )}

          {!hasNoData && !loading && (
             <TouchableOpacity
               style={[styles.createBtn, { marginTop: 10 }]}
               onPress={() => router.push('/(personal)/create-routine')}
             >
               <Text style={styles.createBtnText}>Create Routine List</Text>
             </TouchableOpacity>
          )}
        </ScrollView>
        <CreateRoutineInListModal
          visible={selectedListForNewRoutine !== null}
          routineListId={selectedListForNewRoutine?.listId ?? null}
          categoryId={selectedListForNewRoutine?.categoryId ?? null}
          onClose={() => setSelectedListForNewRoutine(null)}
          onCreated={() => {
            setSelectedListForNewRoutine(null);
            loadLists(); 
          }}
        />

        {editListParams && (
          <Modal visible={true} transparent animationType="slide" onRequestClose={() => setEditListParams(null)}>
            <CreateRoutineModal
              initialRoutineListId={editListParams.listId}
              initialTitle={editListParams.title}
              initialCategoryId={editListParams.categoryId}
              onClose={() => setEditListParams(null)}
              onCreated={() => {
                setEditListParams(null);
                loadLists();
              }}
            />
          </Modal>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: {
    paddingTop: 60,
    paddingBottom: 10,
    zIndex: 10,
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
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyOuter: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  emptyIconWrapper: {
    backgroundColor: 'rgba(249,168,255,0.12)',
    padding: 30,
    borderRadius: 100,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '85%',
  },
  createBtn: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
