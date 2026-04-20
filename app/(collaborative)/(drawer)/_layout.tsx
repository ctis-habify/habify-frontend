import { CustomDrawerContent } from '@/components/navigation/custom-drawer-content';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import * as React from 'react';

export default function DrawerLayout(): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;

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
          backgroundColor: colors.background,
        },
        drawerActiveTintColor: collaborativePrimary,
        drawerInactiveTintColor: colors.text,
        drawerActiveBackgroundColor: isDark ? `${collaborativePrimary}33` : `${collaborativePrimary}11`,
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
      <Drawer.Screen
        name="leaderboard"
        options={{
          drawerItemStyle: { display: 'none' },
          drawerLabel: "Leaderboard",
          drawerIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
