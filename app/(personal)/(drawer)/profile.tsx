import { BACKGROUND_GRADIENT } from '@/app/theme';
import { FriendList } from '@/components/profile/FriendList';
import { useAuth } from '@/hooks/use-auth';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const displayName = user?.name || 'User';
    const displayEmail = user?.email || 'user@example.com';
    const initial = displayName.charAt(0).toUpperCase();

    // Helper to calculate age
    const calculateAge = (birthDateString?: string) => {
        if (!birthDateString) return 'N/A';
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(user?.birthDate);

    // Helper for Avatar URL
    const getAvatarUrl = (id?: string) => {
        switch (id) {
            case 'avatar1': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix';
            case 'avatar2': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka';
            case 'avatar3': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob';
            case 'avatar4': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack';
            case 'avatar5': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly';
            default: return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(displayName)}`;
        }
    };

    const avatarUrl = getAvatarUrl(user?.avatar);

    return (
        <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
            {/* Header with Menu Button */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                    style={styles.menuButton}
                >
                    <Ionicons name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 44 }} /> {/* Spacer matching menu button size */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View
                    entering={FadeInDown.delay(100).duration(600).springify()}
                    style={styles.profileCard}
                >
                    <View style={[styles.avatarContainer, avatarUrl ? { backgroundColor: 'transparent' } : {}]}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{initial}</Text>
                        )}
                    </View>

                    <Text style={styles.nameText}>{displayName}</Text>
                    <Text style={styles.emailText}>{displayEmail}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{age}</Text>
                            <Text style={styles.statLabel}>Age</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.total_xp || 0}</Text>
                            <Text style={styles.statLabel}>Total XP</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.current_streak || 0}</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Friends</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <FriendList friends={[]} />
                </Animated.View>

            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // Gradient handles background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        // Removed explicit background color/border to blend with gradient
    },
    menuButton: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    seeAllText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
});


