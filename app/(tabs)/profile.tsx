import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { requestNotificationPermission } from '../../src/utils/notifications';
import { authApi } from '../../src/api/auth';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { BorderRadius, Spacing, Typography } from '../../src/theme';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit Profile modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditError(null);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Name cannot be empty');
      return;
    }

    try {
      setIsSavingProfile(true);
      setEditError(null);
      const updatedUser = await authApi.updateProfile({
        name: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      updateUser(updatedUser);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setEditError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Needed',
          'Please enable notifications in your phone settings to receive daily habit reminders.'
        );
        setNotificationsEnabled(false);
        return;
      }
    }
    setNotificationsEnabled(value);
  };

  const handleLogoutPrompt = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of HabitFlow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Account</Text>
        <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'HabitFlow User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openEditModal}
            style={[styles.editBadge, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Dark Mode */}
          <View style={[styles.settingsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Appearance</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme active' : 'Warm paper light theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Daily Reminders */}
          <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: notificationsEnabled
                      ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#E3F1EC')
                      : colors.surfaceSubtle,
                  },
                ]}
              >
                <Ionicons
                  name={notificationsEnabled ? 'notifications' : 'notifications-off-outline'}
                  size={20}
                  color={notificationsEnabled ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Daily Reminders</Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: notificationsEnabled
                          ? (isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5')
                          : (isDark ? 'rgba(108, 114, 128, 0.2)' : '#E5E7EB'),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: notificationsEnabled ? colors.primary : colors.textMuted },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: notificationsEnabled ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {notificationsEnabled ? 'Active' : 'Off'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  {notificationsEnabled
                    ? 'Habit streak alerts & timely nudge enabled'
                    : 'Turn on to stay consistent with streak alerts'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

        <View style={styles.logoutContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogoutPrompt}
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(212, 69, 31, 0.08)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(212, 69, 31, 0.25)',
              },
            ]}
          >
            <View style={[styles.logoutIconWrapper, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="log-out" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out of HabitFlow</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.appInfoFooter}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            HabitFlow Version 1.0.0
          </Text>
          <Text style={[styles.appCredits, { color: colors.textMuted }]}>
            React Native (Expo) • Express • MongoDB Atlas
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsEditModalVisible(false)}
          />
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={[styles.closeModalBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorBoxText, { color: colors.danger }]}>{editError}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: Spacing.xs }}>
              <Input
                label="Full Name"
                placeholder="Enter your name"
                value={editName}
                onChangeText={setEditName}
                leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
              />

              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setIsEditModalVisible(false)}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <Button
                title="Save Changes"
                variant="primary"
                loading={isSavingProfile}
                onPress={handleSaveProfile}
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  subHeader: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: Typography.size.xxl,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
    marginLeft: Spacing.xs,
  },
  editText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  userName: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.size.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowTitle: {
    fontSize: Typography.size.md,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  appInfoFooter: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  logoutContainer: {
    marginBottom: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  logoutIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl * 1.2,
    borderWidth: 1.5,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  errorBoxText: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  appVersion: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  appCredits: {
    fontSize: Typography.size.xs,
  },
});

