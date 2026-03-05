import { CustomDrawerContent } from '@/components/navigation/custom-drawer-content';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

// Collaborative Theme Color (Fuchsia-400) - Compatible with Purple
const COLLABORATIVE_PRIMARY = '#E879F9';

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
          backgroundColor: theme === 'dark' ? '#0F172A' : '#2e1065',
        },
        drawerActiveTintColor: theme === 'dark' ? colors.secondary : COLLABORATIVE_PRIMARY,
        drawerInactiveTintColor: theme === 'dark' ? '#E5E7EB' : colors.text,
        drawerActiveBackgroundColor: theme === 'dark' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(232, 121, 249, 0.1)',
        drawerLabelStyle: {
          marginLeft: 0,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="routines"
        options={{
          drawerItemStyle: { display: 'none' },
          drawerLabel: "Collaborative Routines",
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="add-friend"
        options={{
          drawerLabel: "Add Friend",
          drawerIcon: ({ color, size }) => <Ionicons name="person-add-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="friends"
        options={{
          drawerLabel: "Friends",
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="browse"
        options={{
          drawerLabel: "Browse Routines",
          drawerIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
