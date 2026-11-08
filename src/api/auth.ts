import { apiClient } from './client';

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export const authApi = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse['data']> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse['data']> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },
};

