import { getBackgroundGradient } from '@/app/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// UI
import { AnimatedTabSwitcher } from '@/components/ui/animated-tab-switcher';

const PERSONAL_GRADIENT = ['#4c1d95', '#7c3aed'] as const;
const PERSONAL_PRIMARY = '#f9a8ff';

export default function PersonalRoutinesScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useColorScheme() ?? 'light';
  const screenGradient = theme === 'dark' ? getBackgroundGradient(theme) : PERSONAL_GRADIENT;
  const [activeTab, setActiveTab] = useState('Personal');
  const isSwitchingRef = useRef(false);

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

  return (
    <View style={{ flex: 1, backgroundColor: screenGradient[0] }}>
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
          {/* Bugünün rutinleri header’ı */}
          <TouchableOpacity
            style={styles.sectionHeader}
            activeOpacity={0.85}
            onPress={() => router.push('/(personal)/(drawer)/today-routines' as any)}
          >
            <Text style={styles.sectionTitle}>Today&apos;s Routines</Text>
          </TouchableOpacity>

          {/* Empty-state kartı (ekrandaki ilk ss) */}
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
        </ScrollView>
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
