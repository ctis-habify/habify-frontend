import { CustomDrawerContent } from '@/components/navigation/custom-drawer-content';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

// Collaborative Theme Color (Fuchsia-400) - Compatible with Purple
const COLLABORATIVE_PRIMARY = '#E879F9';

export default function DrawerLayout(): React.ReactElement {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: COLLABORATIVE_PRIMARY,
        drawerInactiveTintColor: Colors.light.text,
        drawerActiveBackgroundColor: 'rgba(232, 121, 249, 0.1)', // Fuchsia with opacity
        drawerLabelStyle: {
            marginLeft: 0,
            fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="routines"
        options={{
          drawerLabel: "Collaborative Routines",
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
    </Drawer>
  );
}
