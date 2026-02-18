import { Colors } from '@/constants/theme';
import { setAuthToken } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';

export function CustomDrawerContent(props: DrawerContentComponentProps): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initial = displayName.charAt(0).toUpperCase();

  // Map IDs to URLs (Ensure consistency with Register screen)
  const getAvatarUrl = (id?: string) => {
    switch (id) {
      case 'avatar1': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix';
      case 'avatar2': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka';
      case 'avatar3': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob';
      case 'avatar4': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack';
      case 'avatar5': return 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly';
      default: return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(displayName)}`;
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar);

  const handleLogout = async () => {
    try {
      // 1. Clear token
      await SecureStore.deleteItemAsync('habify_access_token');
      setAuthToken(null);
      // 2. Redirect to auth
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>

        {/* Header / Top Section */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.avatarPlaceholder, avatarUrl ? { backgroundColor: 'transparent' } : {}]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <View style={styles.divider} />

        {/* Standard Drawer Items */}
        <DrawerItemList {...props} />

        {/* Custom Placeholders */}
        <DrawerItem
          label="Settings"
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => router.push('/(personal)/(drawer)/settings')}
          labelStyle={{ marginLeft: 0 }}
        />

        <DrawerItem
          label="Analytics (Soon)"
          icon={({ size }) => <Ionicons name="bar-chart-outline" size={size} color={Colors.light.icon} />}
          onPress={() => { }}
          labelStyle={{ marginLeft: 0, color: Colors.light.icon }}
        />

      </DrawerContentScrollView>

      {/* Footer / Logout */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.divider} />
        <DrawerItem
          label="Logout"
          icon={({ size }) => <Ionicons name="log-out-outline" size={size} color={Colors.light.error} />}
          onPress={handleLogout}
          labelStyle={{ color: Colors.light.error, marginLeft: 0, fontWeight: '600' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 0,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden', // Ensure image stays round
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Match placeholder radius
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  email: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  footer: {
    // backgroundColor: Colors.light.background,
  },
});
