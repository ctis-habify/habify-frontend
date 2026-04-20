import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Friend, FriendItem } from './FriendItem';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FriendListProps {
    friends: Friend[];
    onPressFriend?: (friendId: string) => void;
}

export function FriendList({ friends, onPressFriend }: FriendListProps): React.ReactElement {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];

    const handlePress = useCallback(
        (friendId: string) => {
            onPressFriend?.(friendId);
        },
        [onPressFriend],
    );

    if (!friends || friends.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text }]}>No friends yet</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Add friends to see them here!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {friends.map((friend) => (
                <FriendItem
                    key={friend.id}
                    friend={friend}
                    onPress={() => handlePress(friend.id)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
    },
    emptyContainer: {
        paddingVertical: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptySubText: {
        fontSize: 14,
    },
});
