import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { friendService, UserSearchResult } from '@/services/friend.service';
import { routineService } from '@/services/routine.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const COLLABORATIVE_PRIMARY = '#E879F9';

interface ManageRoutineUsersModalProps {
    visible: boolean;
    onClose: () => void;
    routineId: string;
}

interface Participant {
    id?: string;
    userId?: string;
    username?: string;
    name?: string;
    avatarUrl?: string;
    avatar?: string;
    role?: string;
    user?: {
        id: string;
        name?: string;
        username?: string;
        avatarUrl?: string;
    };
}

export const ManageRoutineUsersModal: React.FC<ManageRoutineUsersModalProps> = ({
    visible,
    onClose,
    routineId,
}) => {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    const [friendsList, setFriendsList] = useState<UserSearchResult[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [friendsRes, groupRes] = await Promise.all([
                friendService.getFriends().catch(() => []),
                routineService.getGroupDetail(routineId).catch(() => ({ participants: [] }))
            ]);
            setFriendsList(friendsRes || []);
            setParticipants(groupRes?.participants || []);
        } catch {
            setFriendsList([]);
            setParticipants([]);
        } finally {
            setLoading(false);
        }
    }, [routineId]);

    useEffect(() => {
        if (visible && routineId) {
            fetchData();
        }
    }, [visible, routineId, fetchData]);

    const handleInvite = async (user: UserSearchResult) => {
        setInvitingId(user.id);
        try {
            await routineService.sendRoutineInvite(routineId, user.id);
            Alert.alert('Success', `Invited ${user.name} to the routine!`);
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'response' in e
                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                    : 'Failed to send invite.';
            Alert.alert('Error', msg || 'Failed to send invite.');
        } finally {
            setInvitingId(null);
        }
    };

    const handleDelete = (user: Participant) => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${user.name || user.username} from this routine?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const identifier = (user.userId || user.id) ?? '';
                        setActioningId(identifier);
                        try {
                            await routineService.removeMemberFromRoutine(routineId, identifier);
                            // Optimistically remove from list
                            setParticipants(prev => prev.filter(p => (p.userId || p.id) !== identifier));
                        } catch (e: unknown) {
                            const msg =
                                e && typeof e === 'object' && 'response' in e
                                    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
                                    : 'Failed to remove member.';
                            Alert.alert('Error', msg || 'Failed to remove member.');
                        } finally {
                            setActioningId(null);
                        }
                    },
                },
            ]
        );
    };

    const renderUserRow = (item: Participant | UserSearchResult, isMember: boolean, index: number) => {
        // Handle potential nested user object from participants or flat from friends
        const user = ('user' in item && item.user) ? item.user : item;
        const userIdProp = 'userId' in item ? item.userId : undefined;
        const key = userIdProp || item.id || index;
        const displayName = ('name' in user ? user.name : undefined) || ('username' in user ? user.username : undefined) || 'User';

        const getAvatarUrl = (id?: string) => {
            switch (id) {
                case 'avatar1': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix';
                case 'avatar2': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka';
                case 'avatar3': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob';
                case 'avatar4': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack';
                case 'avatar5': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly';
                default: return id ? id : null;
            }
        };

        const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : ('avatar' in user ? user.avatar : undefined);
        const resolvedAvatarUrl = getAvatarUrl(avatarUrl ?? undefined);

        const identifier = userIdProp || item.id;

        return (
            <View key={`${isMember ? 'member' : 'friend'}-${key}-${index}`} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.avatarWrap}>
                    {resolvedAvatarUrl ? (
                        <Image source={{ uri: resolvedAvatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.avatarLetter, { color: colors.white }]}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {displayName}
                    </Text>
                    {'username' in user && user.username && (
                        <Text style={[styles.meta, { color: colors.icon }]} numberOfLines={1}>
                            @{user.username}
                        </Text>
                    )}
                </View>
                {!isMember && (
                    <TouchableOpacity
                        style={[
                            styles.inviteBtn,
                            { backgroundColor: isDark ? colors.secondary : colors.primary },
                            invitingId === identifier && styles.inviteBtnDisabled,
                        ]}
                        onPress={() => handleInvite(item as UserSearchResult)}
                        disabled={invitingId !== null}
                    >
                        {invitingId === identifier ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <>
                                <Ionicons name="paper-plane" size={16} color={colors.white} />
                                <Text style={[styles.inviteBtnText, { color: colors.white }]}>Invite</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
                {isMember && (item as Participant).role !== 'creator' && (
                    <TouchableOpacity
                        style={[styles.iconBtn, styles.deleteBtn, actioningId === identifier && styles.btnDisabled, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                        onPress={() => handleDelete(item as Participant)}
                        disabled={actioningId !== null}
                        hitSlop={8}
                    >
                        {actioningId === identifier ? (
                            <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Filter out friends that are already participants
    const friendsToInvite = friendsList.filter(friend =>
        !participants.some(p => {
            const participantId = p.userId || p.user?.id || p.id;
            return participantId === friend.id;
        })
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Manage Users</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={12} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                            <Ionicons name="close" size={24} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {participants.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="people" size={20} color={colors.primary} />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Members</Text>
                                    </View>
                                    {participants.map((p, index) => renderUserRow(p, true, index))}
                                </View>
                            )}

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="person-add" size={20} color={isDark ? colors.secondary : colors.primary} />
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite Friends</Text>
                                </View>
                                {friendsToInvite.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                                            No more friends to invite.
                                        </Text>
                                    </View>
                                ) : (
                                    friendsToInvite.map((f, index) => renderUserRow(f, false, index))
                                )}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: '85%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1.5,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,0,0,0.05)',
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarWrap: {
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: 22,
        fontWeight: '800',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
    },
    meta: {
        fontSize: 13,
        marginTop: 4,
        fontWeight: '500',
        opacity: 0.8,
    },
    inviteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
    },
    inviteBtnDisabled: {
        opacity: 0.6,
    },
    inviteBtnText: {
        fontWeight: '800',
        fontSize: 14,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteBtn: {},
    btnDisabled: {
        opacity: 0.5,
    },
});
