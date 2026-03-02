// services/ProfileService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { 
  FullClientInfo, 
  AvatarResponse, 
  StudentResultResponse,
  CreateAvatarRequest,
  UpdateAvatarRequest,
  CreateStudentResultRequest,
  UpdateStudentResultRequest,
  StudentProgress
} from "./types/profile";
import $api from "./api";

export class ProfileService {
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

  // ============= PROFILE INFO METHODS =============

  /**
   * Получение полной информации о клиенте по auditoryId
   */
  static async getFullProfileByAuditoryId(auditoryId: string): Promise<FullClientInfo> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/client/auditory/${auditoryId}/full`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get full profile error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch profile");
    }
  }

  /**
   * Получение полной информации о клиенте по clientId
   */
  static async getFullProfileByClientId(clientId: string): Promise<FullClientInfo> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/client/${clientId}/full`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get full profile error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch profile");
    }
  }

  // ============= AVATAR METHODS =============

  /**
   * Создание аватара
   */
  static async createAvatar(data: CreateAvatarRequest): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(
        `/profile/avatar`, 
        data, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Create avatar error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create avatar");
    }
  }

  /**
   * Загрузка аватара через multipart/form-data
   */
  static async uploadAvatar(auditoryId: string, file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();
      
      const formData = new FormData();
      formData.append('auditoryId', auditoryId);
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      const response = await $api.post('/profile/avatar/upload', formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error("Upload avatar error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to upload avatar");
    }
  }

  /**
   * Получение аватара по ID
   */
  static async getAvatarById(id: string): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/avatar/${id}`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get avatar error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch avatar");
    }
  }

  /**
   * Получение аватара по ID пользователя
   */
  static async getAvatarByAuditoryId(auditoryId: string): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/avatar/user/${auditoryId}`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get avatar by user error:", error.response?.data || error.message);
      
      // Если 404 - аватар не найден, возвращаем null или пробрасываем ошибку
      if (error.response?.status === 404) {
        throw new Error("Avatar not found");
      }
      
      throw new Error(error.response?.data?.message || "Failed to fetch avatar");
    }
  }

  /**
   * Обновление аватара по ID
   */
  static async updateAvatar(id: string, data: UpdateAvatarRequest): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(
        `/profile/avatar/${id}`, 
        data, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Update avatar error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update avatar");
    }
  }

  /**
   * Обновление аватара по ID пользователя
   */
  static async updateAvatarByAuditoryId(auditoryId: string, data: UpdateAvatarRequest): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(
        `/profile/avatar/user/${auditoryId}`, 
        data, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Update avatar by user error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update avatar");
    }
  }

  /**
   * Удаление аватара по ID
   */
  static async deleteAvatar(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/profile/avatar/${id}`, this.getHeaders(token));
      return { success: true };
    } catch (error: any) {
      console.error("Delete avatar error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete avatar");
    }
  }

  /**
   * Удаление аватара по ID пользователя
   */
  static async deleteAvatarByAuditoryId(auditoryId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/profile/avatar/user/${auditoryId}`, this.getHeaders(token));
      return { success: true };
    } catch (error: any) {
      console.error("Delete avatar by user error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete avatar");
    }
  }

  // ============= STUDENT RESULTS METHODS =============

  /**
   * Создание результата прохождения урока
   */
  static async createStudentResult(data: CreateStudentResultRequest): Promise<StudentResultResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(
        `/profile/student-results`, 
        data, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Create student result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create student result");
    }
  }

  /**
   * Получение результата по ID
   */
  static async getStudentResultById(id: string): Promise<StudentResultResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/student-results/${id}`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get student result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch student result");
    }
  }

  /**
   * Получение всех результатов студента
   */
  static async getStudentResultsByClientId(clientId: string): Promise<StudentResultResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/student-results/client/${clientId}`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get student results error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch student results");
    }
  }

  /**
   * Получение всех результатов по уроку
   */
  static async getStudentResultsByLessonId(lessonId: string): Promise<StudentResultResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/student-results/lesson/${lessonId}`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get lesson results error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson results");
    }
  }

  /**
   * Получение прогресса студента
   */
  static async getStudentProgress(clientId: string): Promise<StudentProgress> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/student-results/client/${clientId}/progress`, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Get student progress error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch student progress");
    }
  }

  /**
   * Обновление результата по ID
   */
  static async updateStudentResult(id: string, data: UpdateStudentResultRequest): Promise<StudentResultResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(
        `/profile/student-results/${id}`, 
        data, 
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("Update student result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update student result");
    }
  }

  /**
   * Удаление результата по ID
   */
  static async deleteStudentResult(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/profile/student-results/${id}`, this.getHeaders(token));
      return { success: true };
    } catch (error: any) {
      console.error("Delete student result error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete student result");
    }
  }

  /**
   * Удаление всех результатов студента
   */
  static async deleteAllStudentResults(clientId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/profile/student-results/client/${clientId}`, this.getHeaders(token));
      return { success: true };
    } catch (error: any) {
      console.error("Delete all student results error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete student results");
    }
  }
}