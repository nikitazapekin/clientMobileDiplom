 
import AsyncStorage from "@react-native-async-storage/async-storage";
import $api from "./api";
import type { CourseResponse } from "./types/course";

export interface SubscriptionResponse {
  success: boolean;
  message?: string;
}

export default class SubscriptionService {
  private static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }
 
  static async subscribeToCourse(auditoryId: string, courseId: string): Promise<SubscriptionResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post<SubscriptionResponse>(
        `/profile/client/${auditoryId}/courses/${courseId}/subscribe`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Subscribe to course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to subscribe to course");
    }
  }
 
  static async unsubscribeFromCourse(auditoryId: string, courseId: string): Promise<SubscriptionResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.delete<SubscriptionResponse>(
        `/profile/client/${auditoryId}/courses/${courseId}/unsubscribe`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Unsubscribe from course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to unsubscribe from course");
    }
  }
 
  static async getStudentCourses(auditoryId: string): Promise<CourseResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get<CourseResponse[]>(
        `/profile/client/${auditoryId}/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get student courses error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch student courses");
    }
  }
 
  static async checkSubscription(auditoryId: string, courseId: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      const response = await $api.get<{ subscribed: boolean }>(
        `/profile/client/${auditoryId}/courses/${courseId}/check`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.subscribed;
    } catch (error: any) {
      console.error("Check subscription error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to check subscription");
    }
  }
 
  static async getSubscriptionsCount(auditoryId: string): Promise<number> {
    try {
      const token = await this.getToken();
      const response = await $api.get<{ count: number }>(
        `/profile/client/${auditoryId}/courses/count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.count;
    } catch (error: any) {
      console.error("Get subscriptions count error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to get subscriptions count");
    }
  }
 
  static async unsubscribeFromMultipleCourses(auditoryId: string, courseIds: string[]): Promise<SubscriptionResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post<SubscriptionResponse>(
        `/profile/client/${auditoryId}/courses/unsubscribe-multiple`,
        { courseIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Bulk unsubscribe error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to unsubscribe from multiple courses");
    }
  }

  
  static async getPopularCourses(limit: number = 10): Promise<CourseResponse[]> {
    try {
      const response = await $api.get<CourseResponse[]>(
        `/courses/popular?limit=${limit}`
      );

      return response.data;
    } catch (error: any) {
      console.error("Get popular courses error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch popular courses");
    }
  }
}