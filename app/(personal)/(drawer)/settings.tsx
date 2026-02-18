import { BACKGROUND_GRADIENT } from '@/app/theme';
import { EditProfileModal } from '@/components/settings/edit-profile-modal';
import { SettingsItem } from '@/components/settings/settings-item';
import { SettingsSection } from '@/components/settings/settings-section';
import { useAuth } from '@/hooks/use-auth';
import { useThemeControl } from '@/hooks/use-color-scheme';
import { userService } from '@/services/user.service';
import { User, UserUpdateDto } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useThemeControl();
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/(auth)');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Permanently Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
              router.replace('/(auth)');
            } catch (error) {
              console.error("Delete account failed", error);
              Alert.alert("Error", "Failed to delete account.");
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async (data: UserUpdateDto) => {
    try {
      // 1. Update backend
      const updatedUser = await userService.updateUser(data);
      // 2. Update local context
      await updateUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      throw error; // Re-throw so modal allows retry or stays open
    }
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Account Section */}
        <SettingsSection title="Account" delay={100}>
          <SettingsItem
            icon="person-outline"
            label="Name"
            value={user?.name || "User"}
            onPress={() => setModalVisible(true)}
          />
          <SettingsItem
            icon="mail-outline"
            label="Email"
            value={user?.email || "user@example.com"}
            type="info"
          />
          <SettingsItem
            icon="calendar-outline"
            label="Birth Date"
            value={user?.birthDate ? new Date(user.birthDate).toLocaleDateString() : "Not set"}
            onPress={() => setModalVisible(true)}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences" delay={200}>
          <SettingsItem
            icon="moon-outline"
            label="Dark Mode"
            type="toggle"
            value={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            type="toggle"
            value={notifications}
            onToggle={setNotifications}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support" delay={300}>
          <SettingsItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => console.log('Help')}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => console.log('Privacy')}
          />
        </SettingsSection>

        {/* Log Out */}
        <SettingsSection delay={400}>
          <SettingsItem
            icon="log-out-outline"
            label="Log Out"
            type="action"
            destructive
            onPress={handleLogout}
          />
        </SettingsSection>

        {/* Delete Account */}
        <SettingsSection delay={500}>
          <SettingsItem
            icon="trash-outline"
            label="Permanently Delete Account"
            type="action"
            destructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

      </ScrollView>

      {user && (
        <EditProfileModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          user={user as unknown as User} // Cast safe here as structures are compatible for shared fields
          onSave={handleSaveProfile}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
});
