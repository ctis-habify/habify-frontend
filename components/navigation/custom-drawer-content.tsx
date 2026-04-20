import { Colors } from '@/constants/theme';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUnreadCount } from '@/hooks/use-unread-count';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';

export function CustomDrawerContent(props: DrawerContentComponentProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const { count: unreadCount } = useUnreadCount(!!token);
  const colors = Colors[theme];
  const isCollaborativeDrawer = !props.state.routeNames.includes('profile');
  const activeTint = isDark ? colors.secondary : colors.primary;
  const inactiveTint = isDark ? colors.textSecondary : colors.text;
  const activeBackgroundColor = isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.08)';

  const handleComingSoon = (title: string) => Alert.alert(title, 'Coming soon');

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initial = displayName.charAt(0).toUpperCase();


  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
      >
        {/* Header / Top Section */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 20,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View style={styles.headerTopRow}>
            <UserAvatar 
              url={user?.avatar} 
              name={displayName} 
              size={64} 
              borderWidth={2}
              borderColor={colors.border}
            />

            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => props.navigation.closeDrawer()}
            >
              <Ionicons name="close" size={30} color={colors.icon} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.username, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: isDark ? colors.icon : colors.text, opacity: 0.7 }]}>{displayEmail}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Main Menu */}
        <DrawerItem
          label="Profile"
          icon={({ size, color }) => <Ionicons name="person-outline" size={size} color={color} />}
          onPress={() => router.push('/(personal)/(drawer)/profile')}
          focused={pathname.includes('/(personal)/(drawer)/profile')}
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
        <DrawerItem
          label="My Routines"
          icon={({ size, color }) => <Ionicons name="list-outline" size={size} color={color} />}
          onPress={() => {
            const h = (isCollaborativeDrawer
                ? '/(collaborative)/(drawer)/routines'
                : '/(personal)/(drawer)/routines') as `/(collaborative)/(drawer)/routines` | `/(personal)/(drawer)/routines`;
            router.push(h);
          }}
          focused={
            pathname.includes('/(personal)/(drawer)/routines') ||
            pathname.includes('/(collaborative)/routines')
          }
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
        <DrawerItem
          label="Leaderboard"
          icon={({ size, color }) => <Ionicons name="trophy-outline" size={size} color={color} />}
          onPress={() => router.push('/(collaborative)/(drawer)/leaderboard' as any)}
          focused={pathname.includes('/(collaborative)/(drawer)/leaderboard')}
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
        <DrawerItem
          label="Friends"
          icon={({ size, color }) => <Ionicons name="people-outline" size={size} color={color} />}
          onPress={() => router.push('/(collaborative)/(drawer)/friends')}
          focused={pathname.includes('/(collaborative)/(drawer)/friends')}
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
        <DrawerItem
          label="Notifications"
          icon={({ size, color }) => (
            <NotificationIcon size={size} color={color} unreadCount={unreadCount} />
          )}
          onPress={() => router.push('/(personal)/(drawer)/notifications')}
          focused={pathname.includes('/(personal)/(drawer)/notifications')}
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
        <DrawerItem
          label="Analytics (Soon)"
          icon={({ size, color }) => <Ionicons name="bar-chart-outline" size={size} color={color} />}
          onPress={() => handleComingSoon('Analytics')}
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
        <DrawerItem
          label="Settings"
          icon={({ size, color }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => router.push('/(personal)/(drawer)/settings')}
          focused={pathname.includes('/(personal)/(drawer)/settings')}
          activeTintColor={activeTint}
          inactiveTintColor={inactiveTint}
          activeBackgroundColor={activeBackgroundColor}
          labelStyle={{ marginLeft: 0, fontWeight: '700' }}
        />
      </DrawerContentScrollView>

      {/* Footer / Logout */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 20, backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <DrawerItem
          label="Logout"
          icon={({ size }) => <Ionicons name="log-out-outline" size={size} color={colors.error} />}
          onPress={handleLogout}
          labelStyle={{ color: colors.error, marginLeft: 0, fontWeight: '700' }}
        />
      </View>
    </View>
  );
}

function NotificationIcon({ size, color, unreadCount }: { size: number; color: string; unreadCount: number }) {
    const rotation = useSharedValue(0);
    const badgeScale = useSharedValue(1);

    React.useEffect(() => {
        if (unreadCount > 0) {
            // Shake animation
            rotation.value = withRepeat(
                withSequence(
                    withTiming(-15, { duration: 100, easing: Easing.linear }),
                    withTiming(15, { duration: 100, easing: Easing.linear }),
                    withTiming(0, { duration: 100, easing: Easing.linear }),
                ),
                1, // Play once on mount/update if count > 0
                false
            );

            // Badge pulse
            badgeScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 400 }),
                    withTiming(1, { duration: 400 }),
                ),
                -1, // Infinite pulse
                true
            );
        } else {
            rotation.value = 0;
            badgeScale.value = 1;
        }
    }, [unreadCount, rotation, badgeScale]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotateZ: `${rotation.value}deg` }],
    }));

    const animatedBadgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: badgeScale.value }],
    }));

    return (
        <View>
            <Animated.View style={animatedIconStyle}>
                <Ionicons name="notifications-outline" size={size} color={color} />
            </Animated.View>
            {unreadCount > 0 && (
                <Animated.View style={[styles.badge, animatedBadgeStyle]}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
    flexGrow: 1,
  },
  header: {
    padding: 24,
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    overflow: 'hidden',
    borderWidth: 2,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
  },
  username: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 24,
  },
  footer: {
    marginTop: 'auto',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
});
