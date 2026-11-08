import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '../../src/api/habits';
import { statsApi } from '../../src/api/stats';
import { useTheme } from '../../src/context/ThemeContext';
import { HeatmapGrid } from '../../src/components/HeatmapGrid';
import { Button } from '../../src/components/Button';
import { BorderRadius, Spacing, Typography } from '../../src/theme';
import { formatTime12h, getLocalDateString } from '../../src/utils/date';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  // Habit basic query
  const {
    data: habit,
    isLoading: isHabitLoading,
  } = useQuery({
    queryKey: ['habit', id],
    queryFn: () => habitsApi.getHabitById(id!),
    enabled: !!id,
  });

  // Habit detailed stats query
  const {
    data: stats,
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: ['habit-stats', id],
    queryFn: () => statsApi.getHabitStats(id!),
    enabled: !!id,
  });

  // Toggle check-in mutation
  const toggleMutation = useMutation({
    mutationFn: () => habitsApi.toggleCheckIn(id!, getLocalDateString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit', id] });
      queryClient.invalidateQueries({ queryKey: ['habit-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  if (isHabitLoading || isStatsLoading || !habit) {
    return (
      <SafeAreaView style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const habitColor = habit.color || colors.primary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {habit.title}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/habit/edit/${id}`)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Habit Profile Banner */}
        <View style={[styles.heroBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroIconBox, { backgroundColor: `${habitColor}1A` }]}>
            <Ionicons name={(habit.icon as any) || 'checkbox-outline'} size={32} color={habitColor} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{habit.title}</Text>
          {habit.description ? (
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{habit.description}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            <View style={[styles.pill, { backgroundColor: colors.surfaceSubtle }]}>
              <Ionicons name="repeat-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>Daily</Text>
            </View>
            {habit.reminderTime && (
              <View style={[styles.pill, { backgroundColor: colors.surfaceSubtle }]}>
                <Ionicons name="alarm-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                  {formatTime12h(habit.reminderTime)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3 Metric Summary Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.metricEmoji}>🔥</Text>
            <Text style={[styles.metricVal, { color: colors.streak }]}>{stats?.currentStreak ?? habit.currentStreak}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Current streak</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.metricEmoji}>🏆</Text>
            <Text style={[styles.metricVal, { color: colors.text }]}>{stats?.longestStreak ?? habit.longestStreak}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Longest run</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.metricEmoji}>✅</Text>
            <Text style={[styles.metricVal, { color: colors.text }]}>{stats?.totalCompletions ?? 0}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total check-ins</Text>
          </View>
        </View>

        {/* 30-Day Completion Rate */}
        <View style={[styles.rateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.rateHeader}>
            <Text style={[styles.rateTitle, { color: colors.text }]}>Last 30 days</Text>
            <Text style={[styles.ratePercent, { color: colors.primary }]}>{stats?.completionRate ?? 0}%</Text>
          </View>
          <View style={[styles.rateTrack, { backgroundColor: colors.surfaceSubtle }]}>
            <View
              style={[
                styles.rateFill,
                { width: `${stats?.completionRate ?? 0}%`, backgroundColor: habitColor },
              ]}
            />
          </View>
          <Text style={[styles.rateFooter, { color: colors.textSecondary }]}>
            {stats?.last30DaysCompletions ?? 0} out of 30 days completed
          </Text>
        </View>

        {/* 90-Day Calendar Heatmap */}
        {stats?.heatmap && stats.heatmap.length > 0 ? (
          <HeatmapGrid heatmap={stats.heatmap} habitColor={habitColor} />
        ) : null}

        {/* Today Action Button */}
        <Button
          title={habit.todayDone ? 'Completed today ✓' : 'Mark as completed today'}
          onPress={() => toggleMutation.mutate()}
          loading={toggleMutation.isPending}
          variant={habit.todayDone ? 'secondary' : 'primary'}
          icon={<Ionicons name={habit.todayDone ? 'checkmark-circle' : 'checkmark'} size={20} color={habit.todayDone ? colors.primary : '#FFFFFF'} />}
          style={{ marginBottom: Spacing.xxxl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  heroBanner: {
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroDesc: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  pillText: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: Typography.size.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  rateCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rateTitle: {
    fontSize: Typography.size.md,
    fontWeight: '700',
  },
  ratePercent: {
    fontSize: Typography.size.lg,
    fontWeight: '800',
  },
  rateTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  rateFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  rateFooter: {
    fontSize: Typography.size.xs,
  },
});

