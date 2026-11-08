import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '../../src/api/habits';
import { useTheme } from '../../src/context/ThemeContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { HABIT_COLORS, HABIT_ICONS, BorderRadius, Spacing, Typography } from '../../src/theme';
import { scheduleHabitReminder } from '../../src/utils/notifications';
import { formatTime12h } from '../../src/utils/date';

export default function NewHabitScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book-outline');
  const [selectedColor, setSelectedColor] = useState('#0B7A5E');
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00'); // HH:mm 24h
  const [titleError, setTitleError] = useState<string | undefined>();

  const createMutation = useMutation({
    mutationFn: async () => {
      const habit = await habitsApi.createHabit({
        title: title.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        reminderTime: hasReminder ? reminderTime : null,
      });

      // Schedule local notification if reminder enabled
      if (hasReminder && reminderTime) {
        await scheduleHabitReminder(habit._id, habit.title, reminderTime);
      }

      return habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create habit');
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError('Habit title is required');
      return;
    }
    createMutation.mutate();
  };

  // Quick preset times
  const timePresets = ['07:00', '08:30', '12:30', '18:00', '21:30'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Habit</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={createMutation.isPending}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.saveLink, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Preview Card */}
          <View
            style={[
              styles.previewCard,
              { backgroundColor: colors.surface, borderColor: `${selectedColor}44` },
            ]}
          >
            <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}22` }]}>
              <Ionicons name={selectedIcon as any} size={28} color={selectedColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewTitle, { color: colors.text }]}>
                {title.trim() || 'Habit Name'}
              </Text>
              <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                {hasReminder ? `Daily at ${formatTime12h(reminderTime)}` : 'Every day'}
              </Text>
            </View>
          </View>

          {/* Title & Description Inputs */}
          <Input
            label="Name"
            placeholder="e.g. Morning Meditation, Read 20 mins"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError(undefined);
            }}
            error={titleError}
          />

          <Input
            label="Description (optional)"
            placeholder="e.g. 15 minutes of mindfulness breathing"
            value={description}
            onChangeText={setDescription}
          />

          {/* Color Picker */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Color Accent</Text>
          <View style={styles.colorPalette}>
            {HABIT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  selectedColor === c && styles.selectedColorCircle,
                ]}
              >
                {selectedColor === c && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Icon Picker */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
            Icon
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconScroll}
          >
            {HABIT_ICONS.map((item) => {
              const isSelected = selectedIcon === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  activeOpacity={0.8}
                  onPress={() => setSelectedIcon(item.name)}
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected ? `${selectedColor}22` : colors.surface,
                      borderColor: isSelected ? selectedColor : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.name as any}
                    size={22}
                    color={isSelected ? selectedColor : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.iconLabel,
                      { color: isSelected ? selectedColor : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Daily Reminder Toggle */}
          <View style={[styles.reminderSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderTitleCol}>
                <Text style={[styles.reminderTitle, { color: colors.text }]}>Daily reminder</Text>
                <Text style={[styles.reminderSub, { color: colors.textSecondary }]}>
                  Receive a local notification to keep your streak
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setHasReminder(!hasReminder)}
                style={[
                  styles.switchTrack,
                  { backgroundColor: hasReminder ? colors.primary : colors.surfaceSubtle },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    hasReminder ? styles.switchThumbActive : styles.switchThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {hasReminder && (
              <View style={styles.timePickerContainer}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Pick reminder time:</Text>
                <View style={styles.timePresetsRow}>
                  {timePresets.map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setReminderTime(t)}
                      style={[
                        styles.timePresetBtn,
                        {
                          backgroundColor: reminderTime === t ? colors.primary : colors.surfaceSubtle,
                          borderColor: reminderTime === t ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timePresetText,
                          { color: reminderTime === t ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {formatTime12h(t)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <Button
            title="Create Habit"
            onPress={handleSave}
            loading={createMutation.isPending}
            style={{ marginTop: Spacing.xl, marginBottom: Spacing.xxxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
  },
  saveLink: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    padding: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  previewTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: Typography.size.sm,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.md,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedColorCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  iconScroll: {
    gap: 10,
    paddingBottom: Spacing.md,
  },
  iconBox: {
    width: 72,
    height: 64,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  reminderSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginTop: Spacing.md,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderTitleCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  reminderTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
  reminderSub: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
  timePickerContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  timeLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  timePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePresetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  timePresetText: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
});

