import { HomeButton } from '@/components/navigation/home-button';
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  // Quiet Mode Helpers
  const calculateQuietDuration = useCallback((start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff <= 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m duration`;
  }, []);

  const isCurrentlyQuiet = useCallback((start: string, end: string) => {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = start.split(':').map(Number);
    const s = sH * 60 + sM;
    const [eH, eM] = end.split(':').map(Number);
    const e = eH * 60 + eM;
    return s < e ? (cur >= s && cur < e) : (cur >= s || cur < e);
  }, []);

  // Quiet Mode State
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleToggleQuietMode = useCallback(async (enabled: boolean) => {
    try {
      await updateUser({ 
        quietModeEnabled: enabled,
        quietModeStart: user?.quietModeStart || '22:00',
        quietModeEnd: user?.quietModeEnd || '08:00'
      });
    } catch (error) {
      console.error('Failed to toggle quiet mode:', error);
    }
  }, [updateUser, user]);

  const handleStartTimeChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowStartTimePicker(false);
    if (date && event.type !== 'dismissed') {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      updateUser({ quietModeStart: `${hours}:${minutes}` });
    }
  }, [updateUser]);

  const handleEndTimeChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowEndTimePicker(false);
    if (date && event.type !== 'dismissed') {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      updateUser({ quietModeEnd: `${hours}:${minutes}` });
    }
  }, [updateUser]);

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
          style={[styles.menuButton, { backgroundColor: Colors[colorScheme].surface }]}
        >
          <Ionicons name="menu" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>Settings</Text>
        <HomeButton color={Colors[colorScheme].text} style={[styles.menuButton, { backgroundColor: Colors[colorScheme].surface }]} />

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
          <SettingsItem
            icon="notifications-off-outline"
            label="Quiet Mode"
            type="toggle"
            value={user?.quietModeEnabled || false}
            onToggle={handleToggleQuietMode}
          />
          {(user?.quietModeEnabled) && (
            <View style={styles.quietModeCard}>
              <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                  <View style={[
                    styles.statusDot, 
                    isCurrentlyQuiet(user.quietModeStart || '22:00', user.quietModeEnd || '08:00') && styles.statusDotActive
                  ]} />
                  <Text style={styles.statusText}>
                    {isCurrentlyQuiet(user.quietModeStart || '22:00', user.quietModeEnd || '08:00') ? 'Active' : 'Scheduled'}
                  </Text>
                </View>
                <Text style={styles.cardDuration}>
                  {calculateQuietDuration(user.quietModeStart || '22:00', user.quietModeEnd || '08:00')}
                </Text>
              </View>

              <View style={styles.timerRow}>
                <TouchableOpacity 
                  style={styles.timePickerBtn} 
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <View style={styles.timeIconBox}>
                    <Ionicons name="moon" size={16} color="#A78BFA" />
                  </View>
                  <View>
                    <Text style={styles.timeLabel}>Starts At</Text>
                    <Text style={styles.timeValue}>{user.quietModeStart || '22:00'}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.timeSeparator}>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.2)" />
                </View>

                <TouchableOpacity 
                  style={styles.timePickerBtn} 
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <View style={styles.timeIconBox}>
                    <Ionicons name="sunny" size={16} color="#FBBF24" />
                  </View>
                  <View>
                    <Text style={styles.timeLabel}>Ends At</Text>
                    <Text style={styles.timeValue}>{user.quietModeEnd || '08:00'}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
        <View style={[styles.privacyOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.privacyModal, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border, borderWidth: 1 }]}>
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

      {showStartTimePicker && (
        <DateTimePicker
          value={user?.quietModeStart ? (() => {
            const [h, m] = user.quietModeStart.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m);
            return d;
          })() : new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={user?.quietModeEnd ? (() => {
            const [h, m] = user.quietModeEnd.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m);
            return d;
          })() : new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndTimeChange}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  privacyModal: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '75%',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
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
  quietModeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 10,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  statusDotActive: {
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  timeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timeSeparator: {
    paddingHorizontal: 12,
  },
});
