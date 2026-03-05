import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    DeviceEventEmitter,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { PublicRoutineCard } from '@/components/routines/public-routine-card';
import { Toast } from '@/components/ui/toast';
import { routineService } from '@/services/routine.service';
import { PublicRoutine } from '@/types/routine';

const GRADIENT = ['#2e1065', '#581c87'] as const;
const ACCENT = '#E879F9';

// Spring config for the enter animation – feels snappy and physical
const ENTER_SPRING = { damping: 22, stiffness: 200, mass: 0.8 };
// Exit timing – quick and decisive
const EXIT_TIMING = { duration: 220, easing: Easing.in(Easing.cubic) };

export default function BrowsePublicRoutinesScreen(): React.ReactElement {
    const navigation = useNavigation();
    const router = useRouter();

    const [routines, setRoutines] = useState<PublicRoutine[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    // Incremented on every focus so FlatList items remount and re-trigger entering animations
    const [listKey, setListKey] = useState(0);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Shared animation values (run on UI thread) ──────────────
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(40);   // slide in from the right
    const scale = useSharedValue(0.97);

    // useFocusEffect fires on every visit (the drawer keeps the component mounted,
    // so useEffect([]) only runs once and leaves shared values at their exit state).
    // We reset to the hidden start position first, then animate in fresh each time.
    useFocusEffect(
        useCallback(() => {
            opacity.value = 0;
            translateX.value = 40;
            scale.value = 0.97;

            opacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
            translateX.value = withSpring(0, ENTER_SPRING);
            scale.value = withSpring(1, ENTER_SPRING);

            // Re-fetch on every focus so the backend filter (joined routines excluded) applies
            fetchRoutines(search.trim() || undefined);

            // Remount FlatList items so their entering animations fire fresh each visit
            setListKey((k) => k + 1);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [fetchRoutines]),
    );

    const pageStyle = useAnimatedStyle(() => ({
        flex: 1,
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { scale: scale.value },
        ],
    }));

    // Exit: animate out, then navigate on the JS side via runOnJS
    const goBack = useCallback(() => {
        'worklet';
        opacity.value = withTiming(0, EXIT_TIMING);
        translateX.value = withTiming(40, EXIT_TIMING);
        scale.value = withTiming(0.97, EXIT_TIMING, (finished) => {
            if (finished) runOnJS(router.back)();
        });
    }, [opacity, translateX, scale, router]);
    // ────────────────────────────────────────────────────────────

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setToastVisible(true);
    }, []);

    const fetchRoutines = useCallback(async (q?: string) => {
        setLoading(true);
        try {
            const data = await routineService.browsePublicRoutines(q || undefined);
            setRoutines(data);
        } catch (e) {
            console.error('Failed to load public routines', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchRoutines();
    }, [fetchRoutines]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchRoutines(search.trim());
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, fetchRoutines]);

    const handleJoin = useCallback(
        async (id: string) => {
            try {
                const res = await routineService.joinPublicRoutine(id);
                showToast(res.message);
                // Flip to "Joined" badge — stays visible in this session
                setRoutines((prev) =>
                    prev.map((r) => (r.id === id ? { ...r, isAlreadyMember: true, memberCount: r.memberCount + 1 } : r)),
                );
                DeviceEventEmitter.emit('SHOW_TOAST', 'Successfully joined the routine!');
            } catch (err: any) {
                showToast(err.message ?? 'Failed to join routine');
            }
        },
        [showToast],
    );

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                    <Ionicons name="search" size={52} color={ACCENT} />
                </View>
                <Text style={styles.emptyTitle}>
                    {search ? 'No routines found' : 'No public routines yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                    {search
                        ? `No results for "${search}". Try a different name.`
                        : 'Public collaborative routines will appear here once created.'}
                </Text>
            </View>
        );
    };

    return (
        // Animated.View handles both enter and exit transforms on the UI thread
        <Animated.View style={pageStyle}>
            <LinearGradient colors={GRADIENT} style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => (navigation as any).dispatch(DrawerActions.toggleDrawer())}
                    >
                        <Ionicons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Browse Routines</Text>
                        <Text style={styles.headerSubtitle}>Discover & join public groups</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={goBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name…"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={search}
                        onChangeText={setSearch}
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {!!search && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color={ACCENT} />
                        <Text style={styles.loadingText}>Loading routines…</Text>
                    </View>
                ) : (
                    <FlatList
                        key={listKey}
                        data={routines}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmpty}
                        renderItem={({ item, index }) => (
                            <PublicRoutineCard
                                routine={item}
                                index={index}
                                accentColor={ACCENT}
                                onJoin={handleJoin}
                            />
                        )}
                    />
                )}

                <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 8,
        paddingHorizontal: 20,
        gap: 14,
    },
    menuBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.09)',
        borderRadius: 16,
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        padding: 0,
    },
    list: {
        paddingHorizontal: 18,
        paddingBottom: 40,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIconWrap: {
        backgroundColor: 'rgba(232, 121, 249, 0.1)',
        padding: 28,
        borderRadius: 999,
        marginBottom: 20,
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
