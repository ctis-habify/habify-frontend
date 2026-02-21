import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Friend, FriendItem } from './FriendItem';

interface FriendListProps {
    friends: Friend[];
}

export const FriendList: React.FC<FriendListProps> = ({ friends }) => {
    if (!friends || friends.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubText}>Add friends to see them here!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {friends.map((friend) => (
                <FriendItem key={friend.id} friend={friend} />
            ))}
        </View>
    );
};

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
        color: '#fff',
        marginBottom: 4,
    },
    emptySubText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
});
