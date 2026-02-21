import AsyncStorage from "@react-native-async-storage/async-storage";
import type { 
  LessonDetailsResponse, 
  CreateLessonDetailsRequest, 
  UpdateLessonDetailsRequest 
} from "./types/lessonDetails";
import $api from "./api";

export class LessonDetailsService {
  private static readonly BASE_URL = "/lesson-details";

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

  static async createLessonDetails(
    data: CreateLessonDetailsRequest
  ): Promise<LessonDetailsResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(this.BASE_URL, data, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Create lesson details error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create lesson details");
    }
  }

  static async getLessonDetailsById(id: string): Promise<LessonDetailsResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`${this.BASE_URL}/${id}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Get lesson details error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson details");
    }
  }

  static async getLessonDetailsByLessonId(lessonId: string): Promise<LessonDetailsResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`${this.BASE_URL}/lesson/${lessonId}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Get lesson details by lesson id error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson details");
    }
  }

  static async updateLessonDetails(
    id: string,
    data: UpdateLessonDetailsRequest
  ): Promise<LessonDetailsResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(`${this.BASE_URL}/${id}`, data, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Update lesson details error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update lesson details");
    }
  }

  static async deleteLessonDetails(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      const response = await $api.delete(`${this.BASE_URL}/${id}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Delete lesson details error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete lesson details");
    }
  }

  static async deleteLessonDetailsByLessonId(lessonId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      const response = await $api.delete(`${this.BASE_URL}/lesson/${lessonId}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Delete lesson details by lesson id error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete lesson details");
    }
  }
}