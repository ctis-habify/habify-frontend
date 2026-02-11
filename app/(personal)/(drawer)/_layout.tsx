import { CustomDrawerContent } from '@/components/navigation/custom-drawer-content';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

export default function DrawerLayout(): React.ReactElement {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors.light.primary,
        drawerInactiveTintColor: Colors.light.text,
        drawerActiveBackgroundColor: 'rgba(124, 58, 237, 0.1)',
        drawerLabelStyle: {
            marginLeft: 0,
            fontWeight: '600',
        },
      }}
    >
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
          drawerItemStyle: { display: 'none' },
          drawerLabel: "Settings",
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
