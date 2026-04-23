import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface Friend {
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline';
}

interface FriendItemProps {
    friend: Friend;
    onPress?: () => void;
}

export function FriendItem({ friend, onPress }: FriendItemProps): React.ReactElement {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={onPress} 
            activeOpacity={0.7}
        >
            <View style={styles.avatarWrapper}>
                <UserAvatar 
                  url={friend.avatar} 
                  name={friend.name} 
                  size={46} 
                />
                {friend.status === 'online' && (
                    <View style={[styles.statusDot, { backgroundColor: colors.success, borderColor: colors.card }]} />
                )}
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{friend.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? colors.icon : '#CBD5E1'} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
});
