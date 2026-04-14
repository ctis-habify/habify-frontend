import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Pressable,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Routine } from '@/types/routine';
import { DeleteRoutineModal } from '../modals/delete-routine-modal';
import { ManageRoutineUsersModal } from '../modals/manage-routine-users-modal';
import { ThrobbingHeart } from '../animations/throbbing-heart';
import { AnimatedFlame } from '../animations/animated-flame';

interface CollaborativeGroupCardProps {
    routine: Routine | null;
    onPress?: (routine: Routine) => void;
    onLeave?: (routine: Routine) => void;
    onDelete?: (routine: Routine) => void;
    isLeaving?: boolean;
    isDeleting?: boolean;
    accentColor?: string;
}

export const CollaborativeGroupCard: React.FC<CollaborativeGroupCardProps> = ({
    routine,
    onPress,
    onLeave,
    onDelete,
    isLeaving = false,
    isDeleting = false,
    accentColor
}) => {
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';
    const effectiveAccentColor = accentColor || Colors[theme].primary;
    const safeRoutine = routine ?? ({} as Routine);
    const {
        id,
        routineName,
        description,
        collaborativeKey,
        isPublic,
        lives = 0,
        streak = 0,
        startTime,
        endTime,
        rewardCondition,
        ageRequirement,
        genderRequirement,
        xpRequirement,
        creatorId,
    } = safeRoutine;

    const categoryValue =
        typeof (safeRoutine as { category?: unknown }).category === 'string'
            ? (safeRoutine as { category?: string }).category || ''
            : ((safeRoutine as { category?: { name?: string } }).category?.name || '');
    const hasCategory = !!safeRoutine.categoryName || !!categoryValue;
    const categoryText = (categoryValue || safeRoutine.categoryName || '').toUpperCase();

    const { user } = useAuth();

    const [isManageModalVisible, setIsManageModalVisible] = React.useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = React.useState(false);
    const cardScale = useSharedValue(1);

    const formatTime = (time?: string) => {
        if (!time) return '--:--';
        const normalized = time.includes('T') ? time.split('T')[1] : time;
        if (!normalized) return '--:--';
        const hhmm = normalized.split(':').slice(0, 2).join(':');
        return hhmm || '--:--';
    };

    const normalizeId = (value?: string | number | null): string => {
        if (value === undefined || value === null) return '';
        return String(value).trim();
    };

    const creatorCandidate = normalizeId(
        creatorId
        || (safeRoutine as { creator_id?: string }).creator_id
        || (safeRoutine as { createdBy?: string }).createdBy
        || (safeRoutine as { userId?: string }).userId
        || (safeRoutine as { user_id?: string }).user_id
        || (safeRoutine as { ownerId?: string }).ownerId
        || (safeRoutine as { creator?: { id?: string } }).creator?.id
        || (safeRoutine as { user?: { id?: string } }).user?.id
    );
    const currentUserId = normalizeId(user?.id);
    const isCreator = !!currentUserId && !!creatorCandidate && currentUserId === creatorCandidate;

    const handleInvite = async () => {
        if (!routine) return;
        try {
            await Share.share({
                message: `Join my collaborative routine "${routineName}" on Habify! Use code: ${collaborativeKey}`,
                title: 'Habify Invitation',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleManageUsers = () => {
        setIsManageModalVisible(true);
    };

    const handleDelete = () => {
        setIsDeleteModalVisible(true);
    };

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    const handlePressIn = () => {
        if (!onPress) return;
        cardScale.value = withSpring(0.985, { damping: 20, stiffness: 260 });
    };

    const handlePressOut = () => {
        if (!onPress) return;
        cardScale.value = withSpring(1, { damping: 18, stiffness: 220 });
    };

    if (!routine) return null;

    return (
        <Animated.View style={animatedCardStyle}>
            <Pressable
                style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}
                onPress={onPress ? () => onPress(routine) : undefined}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!onPress}
            >
                {/* Header: Title & Category */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: Colors[theme].text }]} numberOfLines={1}>{routineName || 'Unnamed Space'}</Text>
                    </View>
                    {hasCategory && (
                        <View style={[styles.categoryBadge, { backgroundColor: `${effectiveAccentColor}22` }]}>
                            <Text style={[styles.categoryText, { color: effectiveAccentColor }]}>
                                {categoryText}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.keyPill, { backgroundColor: Colors[theme].surface }]}>
                        <Ionicons name={isPublic ? "lock-open" : "lock-closed"} size={12} color={Colors[theme].text} style={{ marginRight: 4 }} />
                        <Text style={[styles.categoryText, { color: Colors[theme].text }]}>
                            {isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {!!description && (
                    <Text style={[styles.description, { color: Colors[theme].icon }]} numberOfLines={2}>{description}</Text>
                )}

                {/* Stats Bar */}
                <View style={[styles.statsBar, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)' }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="heart" size={16} color="#ef4444" />
                        <Text style={[styles.statLabel, { color: Colors[theme].icon }]}>Lives: </Text>
                        <Text style={[styles.statValue, { color: Colors[theme].text }]}>{lives}</Text>
                    </View>
                    <View style={[styles.divider, { height: '60%', backgroundColor: Colors[theme].border }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="flame" size={16} color="#f97316" />
                        <Text style={[styles.statLabel, { color: Colors[theme].icon }]}>Streak: </Text>
                        <Text style={[styles.statValue, { color: Colors[theme].text }]}>{streak}</Text>
                    </View>
                    <View style={[styles.divider, { height: '60%', backgroundColor: Colors[theme].border }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color={effectiveAccentColor} />
                        <Text style={[styles.statValue, { color: Colors[theme].text }]}>
                            {(safeRoutine.frequencyType?.toUpperCase() === 'WEEKLY' || 
                              String(safeRoutine.frequency || '').toUpperCase() === 'WEEKLY' ||
                              String(safeRoutine.repetition || '').toUpperCase() === 'WEEKLY' ||
                              String(safeRoutine.repeat || '').toUpperCase() === 'WEEKLY' ||
                              String(safeRoutine.rules?.frequency || '').toUpperCase() === 'WEEKLY')
                                ? 'Weekly'
                                : `${formatTime(startTime || safeRoutine.rules?.time)} - ${formatTime(endTime || safeRoutine.rules?.time)}`}
                        </Text>
                    </View>
                </View>

                {/* Requirements Section */}
                {!!(rewardCondition || ageRequirement || (genderRequirement && genderRequirement !== 'na') || xpRequirement) && (
                    <View style={[styles.footer, { borderTopColor: Colors[theme].border }]}>
                        {!!rewardCondition && (
                            <View style={[styles.conditionItem, { backgroundColor: Colors[theme].surface, borderColor: Colors[theme].border }]}>
                                <Ionicons name="ribbon" size={16} color="#fbbf24" />
                                <Text style={[styles.footerText, { color: Colors[theme].text }]} numberOfLines={1}>{rewardCondition}</Text>
                            </View>
                        )}
                        {!!ageRequirement && (
                            <View style={[styles.conditionItem, { backgroundColor: Colors[theme].surface, borderColor: Colors[theme].border }]}>
                                <Ionicons name="calendar" size={16} color="#38bdf8" />
                                <Text style={[styles.footerText, { color: Colors[theme].text }]} numberOfLines={1}>{ageRequirement}+ Age</Text>
                            </View>
                        )}
                        {!!(genderRequirement && genderRequirement !== 'na') && (
                            <View style={[styles.conditionItem, { backgroundColor: Colors[theme].surface, borderColor: Colors[theme].border }]}>
                                <Ionicons name="person" size={16} color="#f472b6" />
                                <Text style={[styles.footerText, { color: Colors[theme].text }]} numberOfLines={1}>
                                    {genderRequirement.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {!!xpRequirement && (
                            <View style={[styles.conditionItem, { backgroundColor: Colors[theme].surface, borderColor: Colors[theme].border }]}>
                                <Ionicons name="star" size={16} color="#fbbf24" />
                                <Text style={[styles.footerText, { color: Colors[theme].text }]} numberOfLines={1}>{xpRequirement} XP</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isDark ? `${Colors[theme].collaborativePrimary}22` : `${Colors[theme].collaborativePrimary}11`, borderColor: Colors[theme].border }]}
                        onPress={handleInvite}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social" size={18} color={Colors[theme].collaborativePrimary} />
                        <Text style={[styles.actionBtnText, { color: Colors[theme].collaborativePrimary }]}>Invite</Text>
                    </TouchableOpacity>

                    {isCreator && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.08)', borderColor: Colors[theme].border }]}
                            onPress={handleManageUsers}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="people" size={18} color="#38bdf8" />
                            <Text style={[styles.actionBtnText, { color: '#38bdf8' }]}>Manage</Text>
                        </TouchableOpacity>
                    )}

                    {!!onLeave && !isCreator && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.leaveBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', borderColor: Colors[theme].border }]}
                            onPress={() => routine && onLeave(routine)}
                            activeOpacity={0.7}
                            disabled={isLeaving}
                        >
                            <Ionicons name="exit-outline" size={18} color="#f87171" />
                            <Text style={styles.leaveBtnText}>{isLeaving ? 'Leaving...' : 'Leave'}</Text>
                        </TouchableOpacity>
                    )}

                    {!!onDelete && isCreator && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteActionBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)', borderColor: Colors[theme].border }]}
                            onPress={handleDelete}
                            activeOpacity={0.7}
                            disabled={isDeleting}
                        >
                            <Ionicons name="trash-outline" size={18} color="#f87171" />
                            <Text style={styles.deleteActionBtnText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ManageRoutineUsersModal
                    visible={isManageModalVisible}
                    onClose={() => setIsManageModalVisible(false)}
                    routineId={id.toString()}
                />

                <DeleteRoutineModal
                    visible={isDeleteModalVisible}
                    routineName={routineName || ''}
                    onClose={() => setIsDeleteModalVisible(false)}
                    onConfirm={async () => routine && onDelete?.(routine)}
                    isLoading={isDeleting}
                />
            </Pressable>
        </Animated.View >
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 8,
    },
    keyPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginLeft: 4,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    divider: {
        width: 1,
        marginHorizontal: 8,
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: 1,
        paddingTop: 16,
        marginTop: 4,
    },
    conditionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 12,
        borderWidth: 1,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    leaveBtn: {},
    leaveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f87171',
    },
    deleteActionBtn: {},
    deleteActionBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f87171',
    },
});
