import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";

import type { CourseResponse, StudentCourseResponse } from "./types/course";
import $api from "./api";

export interface SubscriptionResponse {
  success: boolean;
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const logSubscriptionError = (label: string, error: unknown) => {
  if (isAxiosError(error)) {
    console.error(label, error.response?.data || error.message);

    return;
  }

  if (error instanceof Error) {
    console.error(label, error.message);

    return;
  }

  console.error(label, error);
};

export default class SubscriptionService {
  private static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }

  static async subscribeToCourse(_auditoryId: string, courseId: string): Promise<SubscriptionResponse> {
    try {
      const token = await this.getToken();

      await $api.post(
        `/course-subscriptions/subscribe/${courseId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        success: true,
      };
    } catch (error: unknown) {
      logSubscriptionError("Subscribe to course error:", error);
      throw new Error(getErrorMessage(error, "Failed to subscribe to course"));
    }
  }

  static async unsubscribeFromCourse(_auditoryId: string, courseId: string): Promise<SubscriptionResponse> {
    try {
      const token = await this.getToken();

      await $api.delete(
        `/course-subscriptions/unsubscribe/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        success: true,
      };
    } catch (error: unknown) {
      logSubscriptionError("Unsubscribe from course error:", error);
      throw new Error(getErrorMessage(error, "Failed to unsubscribe from course"));
    }
  }

  static async getStudentCourses(_auditoryId: string): Promise<StudentCourseResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get<StudentCourseResponse[]>(
        `/course-subscriptions/my-courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      logSubscriptionError("Get student courses error:", error);
      throw new Error(getErrorMessage(error, "Failed to fetch student courses"));
    }
  }

  static async checkSubscription(_auditoryId: string, courseId: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      const response = await $api.get<{ subscribed: boolean }>(
        `/course-subscriptions/check/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.subscribed;
    } catch (error: unknown) {
      logSubscriptionError("Check subscription error:", error);
      throw new Error(getErrorMessage(error, "Failed to check subscription"));
    }
  }

  static async getSubscriptionsCount(auditoryId: string): Promise<number> {
    try {
      const subscriptions = await this.getStudentCourses(auditoryId);

      return subscriptions.length;
    } catch (error: unknown) {
      logSubscriptionError("Get subscriptions count error:", error);
      throw new Error(getErrorMessage(error, "Failed to get subscriptions count"));
    }
  }

  static async unsubscribeFromMultipleCourses(auditoryId: string, courseIds: string[]): Promise<SubscriptionResponse> {
    try {
      await Promise.all(
        courseIds.map((courseId) =>
          this.unsubscribeFromCourse(auditoryId, courseId),
        ),
      );

      return {
        success: true,
      };
    } catch (error: unknown) {
      logSubscriptionError("Bulk unsubscribe error:", error);
      throw new Error(
        getErrorMessage(error, "Failed to unsubscribe from multiple courses"),
      );
    }
  }

  static async getPopularCourses(limit: number = 10): Promise<CourseResponse[]> {
    try {
      const response = await $api.get<CourseResponse[]>(
        `/courses/popular?limit=${limit}`
      );

      return response.data;
    } catch (error: unknown) {
      logSubscriptionError("Get popular courses error:", error);
      throw new Error(getErrorMessage(error, "Failed to fetch popular courses"));
    }
  }
}
