
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  CourseListResponse,
  CourseResponse,
  CourseStatsResponse,
  CourseStatus,
  CreateCourseRequest,
  UpdateCourseRequest
} from "./types/course";
import $api from "./api";

export default class CourseService {
  private static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }

  static async createCourse(data: CreateCourseRequest): Promise<CourseResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post<CourseResponse>("/courses/create", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Create course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create course");
    }
  }

  static async getCourses(options?: {
    page?: number;
    limit?: number;
    status?: CourseStatus;
    search?: string;
  }): Promise<CourseListResponse> {
    try {
      const params = new URLSearchParams();

      if (options?.page) params.append("page", options.page.toString());

      if (options?.limit) params.append("limit", options.limit.toString());

      if (options?.status) params.append("status", options.status);

      if (options?.search) params.append("search", options.search);

      const queryString = params.toString();
      const url = queryString ? `/courses?${queryString}` : "/courses";

      const response = await $api.get<CourseListResponse>(url);

      return response.data;
    } catch (error: any) {
      console.error("Get courses error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch courses");
    }
  }

  static async getCourseById(id: string): Promise<CourseResponse> {
    try {
      const response = await $api.get<CourseResponse>(`/courses/${id}`);

      return response.data;
    } catch (error: any) {
      console.error("Get course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch course");
    }
  }

  static async getCourseStats(id: string): Promise<CourseStatsResponse> {
    try {
      const response = await $api.get<CourseStatsResponse>(`/courses/${id}/stats`);

      return (response.data as any).data ?? response.data;
    } catch (error: any) {
      console.error("Get course stats error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch course stats");
    }
  }

  static async updateCourse(id: string, data: UpdateCourseRequest): Promise<CourseResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put<CourseResponse>(`/courses/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Update course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update course");
    }
  }

  static async deleteCourse(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();

      await $api.delete(`/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Delete course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to delete course");
    }
  }

  static async publishCourse(id: string): Promise<CourseResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post<CourseResponse>(
        `/courses/${id}/publish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Publish course error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to publish course");
    }
  }

  static async getPublishedCourses(): Promise<CourseResponse[]> {
    try {
      const response = await $api.get<CourseResponse[]>("/courses/published");

      return response.data;
    } catch (error: any) {
      console.error("Get published courses error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch published courses");
    }
  }

  static async getCoursesByTag(tag: string): Promise<CourseResponse[]> {
    try {
      const response = await $api.get<CourseResponse[]>(`/courses/tag/${tag}`);

      return response.data;
    } catch (error: any) {
      console.error("Get courses by tag error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch courses by tag");
    }
  }

  static async getMyCourses(): Promise<CourseResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get<CourseResponse[]>("/courses/my-courses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Get my courses error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch your courses");
    }
  }
}
