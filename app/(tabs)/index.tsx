import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi, Habit } from '../../src/api/habits';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { ProgressRing } from '../../src/components/ProgressRing';
import { HabitCard } from '../../src/components/HabitCard';
import { EmptyState } from '../../src/components/EmptyState';
import { getLocalDateString, getFriendlyDate, getGreeting } from '../../src/utils/date';
import { BorderRadius, Spacing, Typography } from '../../src/theme';

export default function TodayScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  // Fetch active habits
  const {
    data: habits = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.getHabits(false),
  });

  // Optimistic Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: (habitId: string) => {
      const today = getLocalDateString();
      return habitsApi.toggleCheckIn(habitId, today);
    },
    onMutate: async (habitId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(['habits']) || [];

      // Optimistically update to the new value
      queryClient.setQueryData<Habit[]>(['habits'], (old = []) =>
        old.map((h) => {
          if (h._id === habitId) {
            const nextDone = !h.todayDone;
            return {
              ...h,
              todayDone: nextDone,
              currentStreak: nextDone ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1),
            };
          }
          return h;
        })
      );

      return { previousHabits };
    },
    onError: (err, habitId, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      // Invalidate to synchronize with server state and stats
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const completedCount = habits.filter((h) => h.todayDone).length;
  const totalCount = habits.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.greetingCol}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {getFriendlyDate()}
          </Text>
          <Text style={[styles.greetingText, { color: colors.text }]}>
            {getGreeting(user?.name)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/habit/new')}
          style={[styles.addBtnHeader, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
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
        {/* Progress Ring Card */}
        <ProgressRing completed={completedCount} total={totalCount} />

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's habits</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Tap the circle to check in
          </Text>
        </View>

        {/* Loading skeleton / spinner */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your habits...</Text>
          </View>
        ) : null}

        {/* Error message */}
        {isError ? (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {(error as any)?.message || 'Failed to load habits. Pull to retry.'}
            </Text>
          </View>
        ) : null}

        {/* Empty state */}
        {!isLoading && habits.length === 0 ? (
          <EmptyState
            title="No habits yet"
            description="Start building consistent daily momentum by creating your first habit."
            buttonTitle="Add your first habit"
            onButtonPress={() => router.push('/habit/new')}
            iconName="flame-outline"
          />
        ) : null}

        {/* Habit cards list */}
        {habits.map((habit) => (
          <HabitCard
            key={habit._id}
            habit={habit}
            onToggle={(id) => toggleMutation.mutate(id)}
            onPress={() => router.push(`/habit/${habit._id}`)}
          />
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/habit/new')}
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  greetingCol: {
    flex: 1,
  },
  dateText: {
    fontSize: Typography.size.sm,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: Typography.size.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.size.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

