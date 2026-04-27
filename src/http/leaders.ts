import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LeaderboardResponse } from './types/leaders';
import $api from './api';

type ApiError = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const apiError = error as ApiError;

  return apiError.response?.data?.message || apiError.message || fallback;
};

export class LeadersService {
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting token:', error);

      return null;
    }
  }

  private static getHeaders(token: string | null) {
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  }

  static async getLeaderboard(): Promise<LeaderboardResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get('/leaders', this.getHeaders(token));

      return response.data;
    } catch (error: unknown) {
      console.error('Get leaderboard error:', getErrorMessage(error, 'Unknown error'));
      throw new Error(getErrorMessage(error, 'Failed to fetch leaderboard'));
    }
  }
}
