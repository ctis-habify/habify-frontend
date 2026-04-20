import { CustomDrawerContent } from '@/components/navigation/custom-drawer-content';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

export default function DrawerLayout(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '100%',
          backgroundColor: colors.background,
        },
        sceneStyle: {
          backgroundColor: colors.surface,
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerActiveBackgroundColor: `${colors.primary}22`, 
        drawerLabelStyle: {
          marginLeft: 0,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="routines"
        options={{
          drawerLabel: "My Routines",
          drawerIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="today-routines"
        options={{
          drawerItemStyle: { display: 'none' }, // Hide from menu
          drawerLabel: "Today",
          drawerIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          drawerLabel: "Analytics & Data",
          drawerIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerItemStyle: { display: 'none' },
          drawerLabel: "Notifications",
          drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
