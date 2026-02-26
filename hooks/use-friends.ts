import { friendService, UserSearchResult } from '@/services/friend.service';
import { useCallback, useEffect, useState } from 'react';

export interface FriendData {
    id: string;
    name: string;
    avatar?: string;
}

interface UseFriendsResult {
    friends: FriendData[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

function mapToFriendData(result: UserSearchResult): FriendData {
    return {
        id: result.id,
        name: result.name,
        avatar: result.avatarUrl ?? undefined,
    };
}

export function useFriends(): UseFriendsResult {
    const [friends, setFriends] = useState<FriendData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFriends = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const data = await friendService.getFriends();
            setFriends(data.map(mapToFriendData));
        } catch (e) {
            console.error('useFriends: failed to fetch friends', e);
            setError('Failed to load friends.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    return { friends, loading, error, refetch: fetchFriends };
}
