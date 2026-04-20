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
    const colors = Colors[theme];
    const effectiveAccentColor = accentColor || colors.primary;
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
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onPress ? () => onPress(routine) : undefined}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!onPress}
            >
                {/* Header: Title & Category */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{routineName || 'Unnamed Space'}</Text>
                    </View>
                    {hasCategory && (
                        <View style={[styles.categoryBadge, { backgroundColor: `${effectiveAccentColor}22` }]}>
                            <Text style={[styles.categoryText, { color: effectiveAccentColor }]}>
                                {categoryText}
                            </Text>
                        </View>
                    )}
                    <View style={[styles.keyPill, { backgroundColor: colors.surface }]}>
                        <Ionicons name={isPublic ? "lock-open" : "lock-closed"} size={12} color={colors.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.categoryText, { color: colors.text }]}>
                            {isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {!!description && (
                    <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>{description}</Text>
                )}

                {/* Stats Bar */}
                <View style={[styles.statsBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0,0,0,0.03)' }]}>
                    <View style={styles.statItem}>
                        <ThrobbingHeart lives={lives} size={16} />
                        <Text style={[styles.statLabel, { color: colors.icon }]}>Lives: </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {(safeRoutine as any).remainingLives != null
                                ? `${(safeRoutine as any).remainingLives}/${lives}`
                                : lives > 0
                                    ? `${Math.max(0, lives - (safeRoutine.missedCount ?? 0))}/${lives}`
                                    : '0'}
                        </Text>
                    </View>
                    <View style={[styles.divider, { height: '60%', backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <AnimatedFlame streak={streak} size={16} />
                        <Text style={[styles.statLabel, { color: colors.icon }]}>Streak: </Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
                    </View>
                    <View style={[styles.divider, { height: '60%', backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="time" size={16} color={effectiveAccentColor} />
                        <Text style={[styles.statValue, { color: colors.text }]}>
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
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        {!!rewardCondition && (
                            <View style={[styles.conditionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Ionicons name="ribbon" size={16} color={colors.gold} />
                                <Text style={[styles.footerText, { color: colors.text }]} numberOfLines={1}>{rewardCondition}</Text>
                            </View>
                        )}
                        {!!ageRequirement && (
                            <View style={[styles.conditionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Ionicons name="calendar" size={16} color={colors.primary} />
                                <Text style={[styles.footerText, { color: colors.text }]} numberOfLines={1}>{ageRequirement}+ Age</Text>
                            </View>
                        )}
                        {!!(genderRequirement && genderRequirement !== 'na') && (
                            <View style={[styles.conditionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Ionicons name="person" size={16} color={isDark ? "#f472b6" : "#db2777"} />
                                <Text style={[styles.footerText, { color: colors.text }]} numberOfLines={1}>
                                    {genderRequirement.toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {!!xpRequirement && (
                            <View style={[styles.conditionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <Ionicons name="star" size={16} color="#fbbf24" />
                                <Text style={[styles.footerText, { color: colors.text }]} numberOfLines={1}>{xpRequirement} XP</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[
                            styles.actionBtn, 
                            { 
                                backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.06)',
                                borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(124, 58, 237, 0.15)'
                            }
                        ]}
                        onPress={handleInvite}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social" size={18} color={isDark ? '#c084fc' : '#7c3aed'} />
                        <Text style={[styles.actionBtnText, { color: isDark ? '#c084fc' : '#7c3aed' }]}>Invite</Text>
                    </TouchableOpacity>

                    {isCreator && (
                        <TouchableOpacity
                            style={[
                                styles.actionBtn, 
                                { 
                                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.06)',
                                    borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.15)'
                                }
                            ]}
                            onPress={handleManageUsers}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="people" size={18} color={isDark ? "#38bdf8" : "#0284c7"} />
                            <Text style={[styles.actionBtnText, { color: isDark ? "#38bdf8" : "#0284c7" }]}>Manage</Text>
                        </TouchableOpacity>
                    )}

                    {!!onLeave && !isCreator && (
                        <TouchableOpacity
                            style={[
                                styles.actionBtn, 
                                styles.leaveBtn, 
                                { 
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.06)',
                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)'
                                }
                            ]}
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
                            style={[
                                styles.actionBtn, 
                                styles.deleteActionBtn, 
                                { 
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.06)',
                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)'
                                }
                            ]}
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
        borderRadius: 26,
        padding: 22,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.08,
        shadowRadius: 28,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    categoryBadge: {
        paddingHorizontal: 12,
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
        fontWeight: '500',
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
        fontWeight: '500',
    },
    statValue: {
        fontSize: 12,
        fontWeight: '700',
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
        borderWidth: 1.5,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '700',
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
        borderWidth: 1.5,
        gap: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '800',
    },
    leaveBtn: {},
    leaveBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#f87171',
    },
    deleteActionBtn: {},
    deleteActionBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#f87171',
    },
});
