import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export interface Friend {
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline';
}

interface FriendItemProps {
    friend: Friend;
}

export const FriendItem: React.FC<FriendItemProps> = ({ friend }) => {
    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.placeholderAvatar}>
                        <Text style={styles.initials}>
                            {friend.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                {/* Optional Status Indicator could go here */}
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{friend.name}</Text>
                {/* <Text style={styles.status}>Online</Text> */}
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    placeholderAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    status: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
});
