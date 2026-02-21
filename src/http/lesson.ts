import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LessonResponse, UpdateLessonRequest, CreateLessonRequest } from "./types/lesson";
import $api from "./api";

export class LessonService {
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (error) {
      console.error("Error getting token:", error);
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

  static async createLesson(data: CreateLessonRequest): Promise<LessonResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(`/lessons`, data, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Create lesson error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create lesson");
    }
  }

  static async getLesson(id: string): Promise<LessonResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/lessons/${id}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Get lesson error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson");
    }
  }

  static async getLessonByMapElementId(mapElementId: string): Promise<LessonResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/lessons/map-element/${mapElementId}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Get lesson by map element id error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson");
    }
  }

  static async updateLesson(id: string, data: UpdateLessonRequest): Promise<LessonResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(`/lessons/${id}`, data, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Update lesson error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update lesson");
    }
  }

  static async deleteLesson(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/lessons/${id}`, this.getHeaders(token));
      return { success: true };
    } catch (error: any) {
      console.error("Delete lesson error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete lesson");
    }
  }
}