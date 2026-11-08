import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { statsApi, DayCompletion } from '../../src/api/stats';
import { habitsApi, Habit } from '../../src/api/habits';
import { useTheme } from '../../src/context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../../src/theme';

export default function StatsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Overview stats query
  const {
    data: overview,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => statsApi.getOverview(),
  });

  // Weekly stats query
  const {
    data: weekly = [],
    isLoading: isWeeklyLoading,
    refetch: refetchWeekly,
  } = useQuery({
    queryKey: ['stats', 'weekly'],
    queryFn: () => statsApi.getWeekly(),
  });

  // Habits for breakdown list
  const {
    data: habits = [],
    isLoading: isHabitsLoading,
    refetch: refetchHabits,
  } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.getHabits(false),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchOverview(), refetchWeekly(), refetchHabits()]);
    setRefreshing(false);
  };

  const isLoading = isOverviewLoading || isWeeklyLoading || isHabitsLoading;

  // Find max completions for bar scaling
  const maxWeekly = Math.max(1, ...weekly.map((d: DayCompletion) => d.completed));

  // Format short weekday name from YYYY-MM-DD
  const formatDayLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Your progress</Text>
        <Text style={[styles.title, { color: colors.text }]}>Analytics & Streaks</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {/* Overview 3 Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.text }]}>{overview?.totalHabits ?? 0}</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Habits</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.primary }]}>
              {overview?.completedToday ?? 0}/{overview?.totalHabits ?? 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Done Today</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.streak }]}>
              {overview?.longestStreak ?? 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Best Streak</Text>
          </View>
        </View>

        {/* Weekly Completion Bar Chart Card */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>This week</Text>
              <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
                Habits completed per day
              </Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.streakBadgeText, { color: colors.primary }]}>Last 7 days</Text>
            </View>
          </View>

          {/* Bar Chart Visualization */}
          <View style={styles.barsContainer}>
            {weekly.map((dayItem: DayCompletion, idx: number) => {
              const heightPct = Math.max(10, Math.round((dayItem.completed / maxWeekly) * 100));
              const isToday = idx === weekly.length - 1;

              return (
                <View key={dayItem.date} style={styles.barCol}>
                  <Text style={[styles.barCount, { color: colors.textSecondary }]}>
                    {dayItem.completed > 0 ? dayItem.completed : ''}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceSubtle }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: isToday ? colors.primary : `${colors.primary}B3`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color: isToday ? colors.primary : colors.textSecondary,
                        fontWeight: isToday ? '800' : '500',
                      },
                    ]}
                  >
                    {formatDayLabel(dayItem.date)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Habits Performance Breakdown List */}
        <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>Active Streaks</Text>
          <Text style={[styles.breakdownSub, { color: colors.textSecondary }]}>
            Consistency across your habits
          </Text>

          {habits.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
              No active habits to show. Add some on the Today tab!
            </Text>
          ) : null}

          {habits.map((habit: Habit) => (
            <View key={habit._id} style={[styles.habitBreakdownRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.habitIconMini, { backgroundColor: `${habit.color || colors.primary}22` }]}>
                <Text style={{ fontSize: 16 }}>{habit.currentStreak > 0 ? '🔥' : '🌱'}</Text>
              </View>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={[styles.habitBreakdownName, { color: colors.text }]} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={[styles.habitBreakdownSub, { color: colors.textSecondary }]}>
                  Longest run: {habit.longestStreak} days
                </Text>
              </View>
              <View style={[styles.streakPill, { backgroundColor: colors.streakLight }]}>
                <Text style={[styles.streakPillVal, { color: colors.streak }]}>
                  {habit.currentStreak}d
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 60 }} />
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
  },
  loadingBox: {
    paddingVertical: Spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: Typography.size.xxl,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: Typography.size.xs,
    fontWeight: '600',
  },
  chartCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  chartTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
  },
  chartSub: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barCount: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  barTrack: {
    width: 24,
    height: 100,
    borderRadius: BorderRadius.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.md,
  },
  barLabel: {
    fontSize: Typography.size.xs,
    marginTop: 6,
  },
  breakdownCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  breakdownTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
  },
  breakdownSub: {
    fontSize: Typography.size.xs,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  emptyNote: {
    fontSize: Typography.size.sm,
    paddingVertical: Spacing.md,
    textAlign: 'center',
  },
  habitBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  habitIconMini: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  habitBreakdownName: {
    fontSize: Typography.size.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  habitBreakdownSub: {
    fontSize: Typography.size.xs,
  },
  streakPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakPillVal: {
    fontSize: Typography.size.sm,
    fontWeight: '800',
  },
});

