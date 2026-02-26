import { getBackgroundGradient } from '@/app/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// UI
import { CreateRoutineInListModal } from '@/components/modals/create-routine-in-list-modal';
import { CreateRoutineModal } from '@/components/modals/create-routine-modal';
import { RoutineCategoryCard } from '@/components/routines/routine-category-card';
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';
import { setAuthToken } from '@/services/api';
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
  const screenGradient = theme === 'dark' ? getBackgroundGradient(theme) : PERSONAL_GRADIENT;
  const [activeTab, setActiveTab] = useState('Personal');
  const isSwitchingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [routineLists, setRoutineLists] = useState<RoutineList[]>([]);
  const [selectedListForNewRoutine, setSelectedListForNewRoutine] = useState<{ listId: number; categoryId?: number | null } | null>(null);
  const [editListParams, setEditListParams] = useState<{ listId: number; title: string; categoryId?: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        stiffness: 160,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateXAnim]);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (token) setAuthToken(token);
      
      const data = await routineService.getGroupedRoutines(token || undefined);
      setRoutineLists(data || []);
    } catch (e) {
      console.error('Failed to load personal routine lists', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLists();
    }, [loadLists]),
  );

  const handleTabSwitch = (tab: string) => {
    if (tab === activeTab || isSwitchingRef.current) return;

    isSwitchingRef.current = true;
    setActiveTab(tab);

    Haptics.selectionAsync().catch(() => undefined);
    setTimeout(() => {
      if (tab === 'Collaborative') router.replace('/(collaborative)/routines' as any);
      if (tab === 'Personal') router.replace('/(personal)/(drawer)/routines' as any);
      isSwitchingRef.current = false;
    }, 90);
  };

  const handleAddRoutine = (listId: string | number, categoryId?: number | null) => {
    console.log('[DEBUG] handleAddRoutine args: listId=', listId, 'categoryId=', categoryId);
    if (!listId) {
      Alert.alert('Error', 'Routine List ID is missing or null.');
      return;
    }
    setSelectedListForNewRoutine({ listId: Number(listId), categoryId });
  };

  const handleEditList = (list: RoutineList) => {
    console.log('[DEBUG] handleEditList triggers', list);
    const listId = list.id ?? (list as any).routineListId;
    if (!listId) return;
    setEditListParams({
      listId: Number(listId),
      title: list.routineListTitle || list.categoryName || '',
      categoryId: list.categoryId || undefined,
    });
  };

  const handleDeleteList = (list: RoutineList) => {
    const listId = list.id ?? (list as any).routineListId;
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
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete list.');
          }
        },
      },
    ]);
  };

  const handlePressRoutine = (routineId: string) => {
    // @ts-ignore
    router.push({ pathname: '/(personal)/routine/[id]', params: { id: routineId } });
  };

  const hasNoData = !loading && routineLists.length === 0;

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
        backgroundColor: screenGradient[0],
        transform: [{ translateX: translateXAnim }, { scale: scaleAnim }],
      }}
    >
      <LinearGradient colors={screenGradient} style={styles.container}>
        {/* HEADER */}
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
            onPress={() => router.push('/(personal)/(drawer)/today-routines' as any)}
          >
            <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />}

          {!loading && routineLists.map((list, idx) => {
            if (idx === 0) console.log('[DEBUG] First routine list looks like:', JSON.stringify(list, null, 2));
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
                onPressAddRoutine={() => handleAddRoutine(list.id ?? (list as any).routineListId, list.categoryId)}
                onEditList={() => handleEditList(list)}
                onDeleteList={() => handleDeleteList(list)}
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
                onPress={() => router.push('/(personal)/create-routine' as any)}
              >
                <Text style={styles.createBtnText}>Create Routine List</Text>
              </TouchableOpacity>
            </View>
          )}

          {!hasNoData && !loading && (
             <TouchableOpacity
               style={[styles.createBtn, { marginTop: 10 }]}
               onPress={() => router.push('/(personal)/create-routine' as any)}
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
    </Animated.View>
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
