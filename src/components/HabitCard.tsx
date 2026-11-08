import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Habit } from '../api/habits';
import { BorderRadius, Spacing, Typography } from '../theme';
import { formatTime12h } from '../utils/date';

interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: string) => void;
  onPress: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggle, onPress }) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handleToggle = () => {
    // Play subtle bouncy spring animation on toggle
    scale.value = withSequence(
      withSpring(0.8, { damping: 10, stiffness: 250 }),
      withSpring(1.15, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onToggle(habit._id);
  };

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const habitColor = habit.color || colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: habit.todayDone ? `${habitColor}33` : colors.border,
        },
      ]}
    >
      {/* Icon with habit color background */}
      <View style={[styles.iconContainer, { backgroundColor: `${habitColor}1A` }]}>
        <Ionicons
          name={(habit.icon as any) || 'checkbox-outline'}
          size={24}
          color={habitColor}
        />
      </View>

      {/* Title & metadata */}
      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { color: colors.text },
            habit.todayDone && styles.completedTitle,
          ]}
        >
          {habit.title}
        </Text>

        <View style={styles.metaRow}>
          {/* Streak pill */}
          <View style={[styles.streakBadge, { backgroundColor: colors.streakLight }]}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={[styles.streakText, { color: colors.streak }]}>
              {habit.currentStreak} {habit.currentStreak === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Optional reminder time */}
          {habit.reminderTime ? (
            <View style={[styles.reminderBadge, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="alarm-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
                {formatTime12h(habit.reminderTime)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Checkbox toggle with animation */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleToggle}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.toggleHitbox}
      >
        <Animated.View
          style={[
            styles.checkbox,
            animatedCheckStyle,
            habit.todayDone
              ? { backgroundColor: habitColor, borderColor: habitColor }
              : { borderColor: colors.borderFocus || colors.border, backgroundColor: 'transparent' },
          ]}
        >
          {habit.todayDone && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </Animated.View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'none',
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  fireEmoji: {
    fontSize: 11,
    marginRight: 3,
  },
  streakText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  reminderText: {
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  toggleHitbox: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

