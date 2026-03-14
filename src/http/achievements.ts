import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  Achievement,
  AchievementDefinitions,
  AchievementProgress,
} from './types/achievements';
import $api from './api';

export class AchievementsService {
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

  /**
   * Get all achievements for a client by clientId
   */
  static async getAchievementsByClientId(clientId: string): Promise<Achievement[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/achievements/client/${clientId}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get achievements error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch achievements');
    }
  }

  /**
   * Get all achievements for a client by auditoryId
   */
  static async getAchievementsByAuditoryId(auditoryId: string): Promise<Achievement[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/achievements/auditory/${auditoryId}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get achievements by auditoryId error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch achievements');
    }
  }

  /**
   * Get achievement by ID
   */
  static async getAchievementById(id: string): Promise<Achievement> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/achievements/${id}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get achievement by ID error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch achievement');
    }
  }

  /**
   * Get achievement progress for a client
   */
  static async getAchievementProgress(auditoryId: string): Promise<AchievementProgress> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/achievements/progress/${auditoryId}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get achievement progress error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch achievement progress');
    }
  }

  /**
   * Get all achievement definitions
   */
  static async getAchievementDefinitions(): Promise<AchievementDefinitions> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/achievements/definitions`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get achievement definitions error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch achievement definitions');
    }
  }

  /**
   * Check and award achievements to a client
   */
  static async checkAndAwardAchievements(auditoryId: string): Promise<Achievement[]> {
    try {
      const token = await this.getToken();
      const response = await $api.post(
        `/achievements/check-and-award`,
        { auditoryId },
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Check and award achievements error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check and award achievements');
    }
  }

  /**
   * Delete achievement by ID
   */
  static async deleteAchievement(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();

      await $api.delete(`/achievements/${id}`, this.getHeaders(token));

      return { success: true };
    } catch (error: any) {
      console.error('Delete achievement error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || 'Failed to delete achievement');
    }
  }

  /**
   * Delete all achievements for a client
   */
  static async deleteAllAchievements(clientId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();

      await $api.delete(`/achievements/client/${clientId}`, this.getHeaders(token));

      return { success: true };
    } catch (error: any) {
      console.error('Delete all achievements error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || 'Failed to delete achievements');
    }
  }
}
