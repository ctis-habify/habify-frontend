import { PublicRoutine } from '@/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PublicRoutineCardProps {
    routine: PublicRoutine;
    index: number;
    accentColor?: string;
    onJoin: (id: string) => Promise<void>;
}

export const PublicRoutineCard: React.FC<PublicRoutineCardProps> = ({
    routine,
    index,
    accentColor = '#E879F9',
    onJoin,
}) => {
    const [joining, setJoining] = React.useState(false);

    const {
        id,
        routineName,
        description,
        category,
        startDate,
        frequencyType,
        memberCount,
        isAlreadyMember,
        ageRequirement,
        genderRequirement,
        xpRequirement,
    } = routine;

    const handleJoin = async () => {
        if (joining || isAlreadyMember) return;
        setJoining(true);
        try {
            await onJoin(id);
        } finally {
            setJoining(false);
        }
    };

    const formattedDate = React.useMemo(() => {
        if (!startDate) return '';
        const d = new Date(startDate);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [startDate]);

    const genderIcon = React.useMemo(() => {
        if (genderRequirement === 'female') return 'woman-outline';
        if (genderRequirement === 'male') return 'man-outline';
        return 'people-outline';
    }, [genderRequirement]);

    const genderLabel = React.useMemo(() => {
        if (genderRequirement === 'female') return 'Female Only';
        if (genderRequirement === 'male') return 'Male Only';
        return '';
    }, [genderRequirement]);

    return (
        <Animated.View entering={FadeInDown.delay(200 + index * 100).springify()}>
            <View style={styles.card}>
                {/* Header Row */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={1}>
                            {routineName}
                        </Text>
                    </View>

                    {/* Category pill */}
                    {!!category && (
                        <View style={[styles.pill, { borderColor: `${accentColor}40` }]}>
                            <Text style={[styles.pillText, { color: accentColor }]}>{category.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                {!!description && (
                    <Text style={styles.description} numberOfLines={2}>
                        {description}
                    </Text>
                )}

                {/* Meta Row */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="repeat" size={14} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.metaText}>{frequencyType}</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.metaText}>{memberCount} members</Text>
                    </View>
                </View>

                {/* Requirements Row */}
                {(!!genderLabel || !!ageRequirement || !!xpRequirement) && (
                    <View style={[styles.metaRow, { marginBottom: 12 }]}>
                        {!!genderLabel && (
                            <>
                                <View style={styles.metaItem}>
                                    <Ionicons name={genderIcon as any} size={14} color="#F472B6" />
                                    <Text style={[styles.metaText, { color: '#F472B6', fontWeight: '600' }]}>{genderLabel}</Text>
                                </View>
                                {(!!ageRequirement || !!xpRequirement) && <View style={styles.metaDot} />}
                            </>
                        )}
                        {!!ageRequirement && (
                            <>
                                <View style={styles.metaItem}>
                                    <Ionicons name="alert-circle-outline" size={14} color="#60A5FA" />
                                    <Text style={[styles.metaText, { color: '#60A5FA', fontWeight: '600' }]}>{ageRequirement}+ Age</Text>
                                </View>
                                {!!xpRequirement && <View style={styles.metaDot} />}
                            </>
                        )}
                        {!!xpRequirement && (
                            <View style={styles.metaItem}>
                                <Ionicons name="star-outline" size={14} color="#FBBF24" />
                                <Text style={[styles.metaText, { color: '#FBBF24', fontWeight: '600' }]}>{xpRequirement} XP</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action */}
                <View style={styles.actionRow}>
                    {isAlreadyMember ? (
                        <View style={styles.joinedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                            <Text style={styles.joinedText}>Joined</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.joinBtn, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}60` }]}
                            onPress={handleJoin}
                            activeOpacity={0.75}
                            disabled={joining}
                        >
                            {joining ? (
                                <ActivityIndicator size="small" color={accentColor} />
                            ) : (
                                <>
                                    <Ionicons name="enter-outline" size={16} color={accentColor} />
                                    <Text style={[styles.joinBtnText, { color: accentColor }]}>Join</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.4,
    },
    pill: {
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    pillText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    description: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 14,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '500',
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    joinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        minWidth: 90,
    },
    joinBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    joinedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: 'rgba(74, 222, 128, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(74, 222, 128, 0.3)',
    },
    joinedText: {
        color: '#4ade80',
        fontSize: 14,
        fontWeight: '700',
    },
});
