import { apiClient } from './client';

export interface OverviewStats {
  totalHabits: number;
  completedToday: number;
  todayPercentage: number;
  longestStreak: number;
}

export interface DayCompletion {
  date: string;
  completed: number;
  total: number;
}

export interface HeatmapItem {
  date: string;
  completed: boolean;
}

export interface HabitDetailedStats {
  habitId: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // percentage in last 30 days
  last30DaysCompletions: number;
  heatmapDates: string[];
  heatmap: HeatmapItem[];
}

export const statsApi = {
  async getOverview(): Promise<OverviewStats> {
    const res = await apiClient.get<{ success: boolean; data: OverviewStats }>('/stats/overview');
    return res.data.data;
  },

  async getWeekly(): Promise<DayCompletion[]> {
    const res = await apiClient.get<{ success: boolean; data: { weekly: DayCompletion[] } }>('/stats/weekly');
    return res.data.data.weekly;
  },

  async getHabitStats(habitId: string): Promise<HabitDetailedStats> {
    const res = await apiClient.get<{ success: boolean; data: HabitDetailedStats }>(`/habits/${habitId}/stats`);
    return res.data.data;
  },
};

