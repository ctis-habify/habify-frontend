import { EditProfileModal } from '@/components/settings/edit-profile-modal';
import { SettingsItem } from '@/components/settings/settings-item';
import { SettingsSection } from '@/components/settings/settings-section';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useThemeControl } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notification.service';
import { userService } from '@/services/user.service';
import { User, UserUpdateDto } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { theme, toggleTheme } = useThemeControl();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'birthDate'>('name');
  const [notifications, setNotifications] = useState(true);

  const handleToggleNotifications = useCallback(async (enabled: boolean) => {
    setNotifications(enabled);
    try {
      if (!enabled) {
        await notificationService.removePushToken();
      }
    } catch {
      // Silently ignore – toggle still reflects the user's preference locally
    }
  }, []);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)');
          },
        },
      ],
    );
  }, [logout, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Permanently Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
              router.replace('/(auth)');
            } catch (error) {
              console.error('Delete account failed', error);
              Alert.alert('Error', 'Failed to delete account.');
            }
          },
        },
      ],
    );
  }, [logout, router]);

  const handleSaveProfile = useCallback(async (data: UserUpdateDto) => {
    try {
      const updatedUser = await userService.updateUser(data);
      await updateUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      throw error;
    }
  }, [updateUser]);

  const handleOpenPrivacy = useCallback(() => setPrivacyModalVisible(true), []);
  const handleClosePrivacy = useCallback(() => setPrivacyModalVisible(false), []);
  const handleOpenNameModal = useCallback(() => {
    setEditingField('name');
    setModalVisible(true);
  }, []);
  const handleOpenBirthDateModal = useCallback(() => {
    setEditingField('birthDate');
    setModalVisible(true);
  }, []);
  const handleCloseModal = useCallback(() => setModalVisible(false), []);

  return (
    <LinearGradient colors={getBackgroundGradient(colorScheme)} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={[styles.menuButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="menu" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Account Section */}
        <SettingsSection title="Account" delay={100}>
          <SettingsItem
            icon="person-outline"
            label="Name"
            value={user?.name || 'User'}
            onPress={handleOpenNameModal}
          />
          <SettingsItem
            icon="mail-outline"
            label="Email"
            value={user?.email || 'user@example.com'}
            type="info"
          />
          <SettingsItem
            icon="calendar-outline"
            label="Birth Date"
            value={user?.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'Not set'}
            onPress={handleOpenBirthDateModal}
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
            onToggle={handleToggleNotifications}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support" delay={300}>
          <SettingsItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={handleOpenPrivacy}
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
          onClose={handleCloseModal}
          user={user as unknown as User}
          field={editingField}
          onSave={handleSaveProfile}
        />
      )}

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClosePrivacy}
      >
        <View style={styles.privacyOverlay}>
          <View style={[styles.privacyModal, { backgroundColor: Colors[colorScheme].card }]}>
            <View style={styles.privacyHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={Colors[colorScheme].tint}
              />
              <Text style={[styles.privacyTitle, { color: Colors[colorScheme].text }]}>Privacy Policy</Text>
            </View>

            <Text style={[styles.privacyBody, { color: Colors[colorScheme].textSecondary }]}>
              When you take a photo to confirm a habit, Habify uses it to verify completion via AI. Your images are kept private, never shared with third parties, and only stored as long as needed.{'\n\n'}By using the app you agree to this.
            </Text>

            <TouchableOpacity
              style={[styles.privacyClose, { backgroundColor: Colors[colorScheme].primary }]}
              onPress={handleClosePrivacy}
            >
              <Text style={[styles.privacyCloseText, { color: Colors[colorScheme].white }]}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  privacyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  privacyModal: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  privacyBody: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  privacyClose: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  privacyCloseText: {
    fontWeight: '800',
    fontSize: 16,
  },
});
