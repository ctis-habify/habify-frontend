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
            {friends.map((friend, index) => (
                <View key={friend.id}>
                    <FriendItem
                        friend={friend}
                        onPress={() => handlePress(friend.id)}
                    />
                    {index < friends.length - 1 && (
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
});
