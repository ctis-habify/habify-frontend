import { Colors } from '@/constants/theme';
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
    const [friendsList, setFriendsList] = useState<UserSearchResult[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
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
            setInvitedUserIds(new Set()); // Reset on fresh fetch
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
            setInvitedUserIds(prev => new Set(prev).add(user.id));
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
            <View key={`${isMember ? 'member' : 'friend'}-${key}-${index}`} style={styles.row}>
                <View style={styles.avatarWrap}>
                    {resolvedAvatarUrl ? (
                        <Image source={{ uri: resolvedAvatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarLetter}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {displayName}
                    </Text>
                    {'username' in user && user.username && (
                        <Text style={styles.meta} numberOfLines={1}>
                            @{user.username}
                        </Text>
                    )}
                </View>
                {!isMember && (
                    <TouchableOpacity
                        style={[
                            styles.inviteBtn,
                            invitingId === identifier && styles.inviteBtnDisabled,
                        ]}
                        onPress={() => handleInvite(item as UserSearchResult)}
                        disabled={invitingId !== null}
                    >
                        {invitingId === identifier ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="paper-plane" size={16} color="#fff" />
                                <Text style={styles.inviteBtnText}>Invite</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
                {isMember && (item as Participant).role !== 'creator' && (
                    <TouchableOpacity
                        style={[styles.iconBtn, styles.deleteBtn, actioningId === identifier && styles.btnDisabled]}
                        onPress={() => handleDelete(item as Participant)}
                        disabled={actioningId !== null}
                        hitSlop={8}
                    >
                        {actioningId === identifier ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Filter out friends that are already participants or have been invited
    const friendsToInvite = friendsList.filter(friend =>
        !invitedUserIds.has(friend.id) &&
        !participants.some(p => {
            const participantId = p.userId || p.user?.id || p.id;
            return participantId === friend.id;
        })
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Manage Users</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={COLLABORATIVE_PRIMARY} />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {participants.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="people" size={20} color={COLLABORATIVE_PRIMARY} />
                                        <Text style={styles.sectionTitle}>Current Members</Text>
                                    </View>
                                    {participants.map((p, index) => renderUserRow(p, true, index))}
                                </View>
                            )}

                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="person-add" size={20} color="#38bdf8" />
                                    <Text style={styles.sectionTitle}>Invite Friends</Text>
                                </View>
                                {friendsToInvite.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptySubtitle}>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Colors.light.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    closeBtn: {
        backgroundColor: Colors.light.surface,
        padding: 6,
        borderRadius: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.light.icon,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.light.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarWrap: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLLABORATIVE_PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetter: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
    },
    meta: {
        fontSize: 13,
        color: Colors.light.icon,
        marginTop: 2,
    },
    inviteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#38bdf8',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    inviteBtnDisabled: {
        opacity: 0.7,
    },
    inviteBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    btnDisabled: {
        opacity: 0.5,
    },
});
