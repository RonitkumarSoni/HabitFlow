import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { requestNotificationPermission } from '../../src/utils/notifications';
import { BorderRadius, Spacing, Typography } from '../../src/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Daily Reminders</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Local notifications for scheduled habits
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
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Actions</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogoutPrompt}
            style={styles.settingsRow}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.danger, fontWeight: '700' }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
  rowSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  appInfoFooter: {
    alignItems: 'center',
    marginTop: Spacing.xl,
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

