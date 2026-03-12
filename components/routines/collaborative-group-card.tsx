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

import { useAuth } from '@/hooks/use-auth';
import { Routine } from '@/types/routine';
import { DeleteRoutineModal } from '../modals/delete-routine-modal';
import { ManageRoutineUsersModal } from '../modals/manage-routine-users-modal';

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
    accentColor = '#E879F9'
}) => {
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
                style={styles.card}
                onPress={onPress ? () => onPress(routine) : undefined}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!onPress}
            >
                {/* Header: Title & Category */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={1}>{routineName || 'Unnamed Space'}</Text>
                    </View>
                    {hasCategory && (
                        <View style={{ marginRight: 8 }}>
                            <Text style={[styles.categoryText, { color: accentColor, opacity: 0.8 }]}>
                                {categoryText}
                            </Text>
                        </View>
                    )}
                    <View style={styles.keyPill}>
                        <Ionicons name={isPublic ? "lock-open" : "lock-closed"} size={12} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={[styles.categoryText, { color: isPublic ? accentColor : '#e2e8f0' }]}>
                            {isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {!!description && (
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                )}

                {/* Stats Bar */}
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Ionicons name="heart" size={16} color="#ef4444" />
                        <Text style={styles.statLabel}>Lives: </Text>
                        <Text style={styles.statValue}>{lives}</Text>
                    </View>
                    <View style={[styles.divider, { height: '60%' }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="flame" size={16} color="#f97316" />
                        <Text style={styles.statLabel}>Streak: </Text>
                        <Text style={styles.statValue}>{streak}</Text>
                    </View>
                    <View style={[styles.divider, { height: '60%' }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color={accentColor} />
                        <Text style={styles.statValue}>{formatTime(startTime)} - {formatTime(endTime)}</Text>
                    </View>
                </View>

                {/* Requirements Section */}
                {!!(rewardCondition || ageRequirement || (genderRequirement && genderRequirement !== 'na') || xpRequirement) && (
                    <View style={styles.footer}>
                        {!!rewardCondition && (
                            <View style={styles.conditionItem}>
                                <Ionicons name="ribbon" size={16} color="#fbbf24" />
                                <Text style={styles.footerText} numberOfLines={1}>{rewardCondition}</Text>
                            </View>
                        )}
                        {!!ageRequirement && (
                            <View style={styles.conditionItem}>
                                <Ionicons name="calendar" size={16} color="#38bdf8" />
                                <Text style={styles.footerText} numberOfLines={1}>{ageRequirement}+ Age</Text>
                            </View>
                        )}
                        {!!(genderRequirement && genderRequirement !== 'na') && (
                            <View style={styles.conditionItem}>
                                <Ionicons name="person" size={16} color="#f472b6" />
                                <Text style={styles.footerText} numberOfLines={1}>
                                    {genderRequirement.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {!!xpRequirement && (
                            <View style={styles.conditionItem}>
                                <Ionicons name="star" size={16} color="#fbbf24" />
                                <Text style={styles.footerText} numberOfLines={1}>{xpRequirement} XP</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'rgba(232, 121, 249, 0.15)' }]}
                        onPress={handleInvite}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social" size={18} color="#E879F9" />
                        <Text style={[styles.actionBtnText, { color: '#E879F9' }]}>Invite</Text>
                    </TouchableOpacity>

                    {isCreator && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}
                            onPress={handleManageUsers}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="people" size={18} color="#38bdf8" />
                            <Text style={[styles.actionBtnText, { color: '#38bdf8' }]}>Manage</Text>
                        </TouchableOpacity>
                    )}

                    {!!onLeave && !isCreator && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.leaveBtn]}
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
                            style={[styles.actionBtn, styles.deleteActionBtn]}
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
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
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
        color: '#fff',
        letterSpacing: -0.5,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    keyPill: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 12,
    },
    description: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    statsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
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
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginLeft: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8,
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 16,
        marginTop: 4,
    },
    conditionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    footerText: {
        color: '#fff',
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
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    leaveBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(248, 113, 113, 0.3)',
    },
    leaveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f87171',
    },
    deleteActionBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(248, 113, 113, 0.3)',
    },
    deleteActionBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f87171',
    },
});
