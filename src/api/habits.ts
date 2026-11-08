import { apiClient } from './client';

export interface Habit {
  _id: string;
  user: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: 'daily';
  reminderTime: string | null;
  isArchived: boolean;
  createdAt: string;
  todayDone: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns?: number;
}

export interface CheckIn {
  _id: string;
  habit: string;
  user: string;
  date: string;
  createdAt: string;
}

export interface ToggleCheckInResponse {
  habit: Habit;
  checkedIn: boolean;
  date: string;
  currentStreak: number;
  longestStreak: number;
}

export const habitsApi = {
  async getHabits(includeArchived = false): Promise<Habit[]> {
    const res = await apiClient.get<{ success: boolean; data: { habits: Habit[] } }>(
      `/habits?includeArchived=${includeArchived}`
    );
    return res.data.data.habits;
  },

  async getHabitById(id: string): Promise<Habit> {
    const res = await apiClient.get<{ success: boolean; data: { habit: Habit } }>(`/habits/${id}`);
    return res.data.data.habit;
  },

  async createHabit(data: {
    title: string;
    description?: string;
    icon?: string;
    color?: string;
    reminderTime?: string | null;
  }): Promise<Habit> {
    const res = await apiClient.post<{ success: boolean; data: { habit: Habit } }>('/habits', data);
    return res.data.data.habit;
  },

  async updateHabit(
    id: string,
    data: {
      title?: string;
      description?: string;
      icon?: string;
      color?: string;
      reminderTime?: string | null;
      isArchived?: boolean;
    }
  ): Promise<Habit> {
    const res = await apiClient.put<{ success: boolean; data: { habit: Habit } }>(`/habits/${id}`, data);
    return res.data.data.habit;
  },

  async deleteHabit(id: string): Promise<void> {
    await apiClient.delete(`/habits/${id}`);
  },

  async archiveHabit(id: string, isArchived?: boolean): Promise<Habit> {
    const res = await apiClient.patch<{ success: boolean; data: { habit: Habit } }>(
      `/habits/${id}/archive`,
      isArchived !== undefined ? { isArchived } : {}
    );
    return res.data.data.habit;
  },

  async toggleCheckIn(id: string, date?: string): Promise<ToggleCheckInResponse> {
    const res = await apiClient.post<{ success: boolean; data: ToggleCheckInResponse }>(
      `/habits/${id}/toggle`,
      date ? { date } : {}
    );
    return res.data.data;
  },

  async getHabitCheckIns(id: string, from?: string, to?: string): Promise<{ checkIns: CheckIn[]; dates: string[] }> {
    let url = `/habits/${id}/checkins`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await apiClient.get<{ success: boolean; data: { checkIns: CheckIn[]; dates: string[] } }>(url);
    return res.data.data;
  },
};

