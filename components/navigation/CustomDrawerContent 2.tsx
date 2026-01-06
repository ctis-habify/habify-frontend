import { Colors } from '@/constants/theme';
import { setAuthToken } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomDrawerContent(props: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      // 1. Clear token
      await SecureStore.deleteItemAsync('habify_access_token');
      setAuthToken(null);
      // 2. Redirect to auth
      router.replace('/(auth)');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        
        {/* Header / Top Section */}
        <View style={styles.header}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>U</Text>
            </View>
            <Text style={styles.username}>User</Text>
            <Text style={styles.email}>user@example.com</Text>
        </View>

        <View style={styles.divider} />

        {/* Standard Drawer Items */}
        <DrawerItemList {...props} />

        {/* Custom Placeholders */}
        <DrawerItem 
            label="Analytics (Soon)" 
            icon={({color, size}) => <Ionicons name="bar-chart-outline" size={size} color={Colors.light.icon} />}
            onPress={() => {}} 
            labelStyle={{ marginLeft: 0, color: Colors.light.icon }}
        />

      </DrawerContentScrollView>

      {/* Footer / Logout */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.divider} />
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={Colors.light.error} />}
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
