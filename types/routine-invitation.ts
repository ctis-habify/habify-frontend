export interface RoutineInvitationItem {
    id: string;
    routineId: string;
    routineName: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatarUrl: string | null;
    toUserId: string;
    toUserName: string;
    toUserAvatarUrl: string | null;
    status: string;
    createdAt: string;
}
