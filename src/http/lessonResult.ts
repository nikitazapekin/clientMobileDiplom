 
import AsyncStorage from "@react-native-async-storage/async-storage";
import $api from "./api";

export interface CreateLessonResultRequest {
  clientId: string;
  lessonId: string;
  countOfStars: number;
  completedAt?: string;
}

export interface UpdateLessonResultRequest {
  countOfStars?: number;
  completedAt?: string;
}

export interface LessonResultResponse {
  id: string;
  clientId: string;
  lessonId: string;
  countOfStars: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProgressResponse {
  totalLessons: number;
  averageStars: number;
  results: LessonResultResponse[];
}

export default class LessonResultService {
  private static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }

  
  static async createLessonResult(data: CreateLessonResultRequest): Promise<LessonResultResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post<LessonResultResponse>(
        "/profile/student-results",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Create lesson result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create lesson result");
    }
  }
 
  static async getLessonResultById(id: string): Promise<LessonResultResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get<LessonResultResponse>(
        `/profile/student-results/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get lesson result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson result");
    }
  }

   
  static async getStudentResults(clientId: string): Promise<LessonResultResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get<LessonResultResponse[]>(
        `/profile/student-results/client/${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get student results error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch student results");
    }
  }
 
  static async getLessonResults(lessonId: string): Promise<LessonResultResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get<LessonResultResponse[]>(
        `/profile/student-results/lesson/${lessonId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get lesson results error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson results");
    }
  }

  /**
   * Получение прогресса студента
   * GET /profile/student-results/client/:clientId/progress
   */
  static async getStudentProgress(clientId: string): Promise<StudentProgressResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get<StudentProgressResponse>(
        `/profile/student-results/client/${clientId}/progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get student progress error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch student progress");
    }
  }
 
  static async updateLessonResult(id: string, data: UpdateLessonResultRequest): Promise<LessonResultResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put<LessonResultResponse>(
        `/profile/student-results/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Update lesson result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update lesson result");
    }
  }

  /**
   * Удаление результата по ID
   * DELETE /profile/student-results/:id
   */
  static async deleteLessonResult(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/profile/student-results/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Delete lesson result error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to delete lesson result");
    }
  }
 
  static async deleteAllStudentResults(clientId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/profile/student-results/client/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Delete all student results error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to delete all student results");
    }
  }

  /**
   * Получение среднего количества звезд студента
   * Вспомогательный метод
   */
  static async getAverageStars(clientId: string): Promise<number> {
    try {
      const results = await this.getStudentResults(clientId);
      if (results.length === 0) return 0;
      
      const totalStars = results.reduce((sum, result) => sum + result.countOfStars, 0);
      return totalStars / results.length;
    } catch (error: any) {
      console.error("Get average stars error:", error.message);
      throw new Error("Failed to calculate average stars");
    }
  }

  /**
   * Получение последних результатов студента
   * Вспомогательный метод
   */
  static async getLatestStudentResults(clientId: string, limit: number = 5): Promise<LessonResultResponse[]> {
    try {
      const results = await this.getStudentResults(clientId);
      return results
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, limit);
    } catch (error: any) {
      console.error("Get latest results error:", error.message);
      throw new Error("Failed to fetch latest results");
    }
  }

  /**
   * Проверка, прошел ли студент урок
   * Вспомогательный метод
   */
  static async hasCompletedLesson(clientId: string, lessonId: string): Promise<boolean> {
    try {
      const results = await this.getStudentResults(clientId);
      return results.some(result => result.lessonId === lessonId);
    } catch (error: any) {
      console.error("Check lesson completion error:", error.message);
      throw new Error("Failed to check lesson completion");
    }
  }

  /**
   * Проверка, прошел ли студент урок с хотя бы 1 звездой
   * @param clientId - ID пользователя
   * @param lessonId - ID урока
   * @returns true, если урок пройден с хотя бы 1 звездой
   */
  static async hasCompletedLessonWithStars(clientId: string, lessonId: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      const response = await $api.get<LessonResultResponse[]>(
        `/profile/student-results/lesson/${lessonId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const results = response.data;
      const userResult = results.find(result => result.clientId === clientId);

      return userResult ? userResult.countOfStars >= 1 : false;
    } catch (error: any) {
      console.error("Check lesson completion with stars error:", error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Получение статистики по урокам для студента
   * Вспомогательный метод
   */
  static async getLessonStats(clientId: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    averageStars: number;
    bestResult: LessonResultResponse | null;
    worstResult: LessonResultResponse | null;
  }> {
    try {
      const results = await this.getStudentResults(clientId);
      
      if (results.length === 0) {
        return {
          totalLessons: 0,
          completedLessons: 0,
          averageStars: 0,
          bestResult: null,
          worstResult: null,
        };
      }

      const totalStars = results.reduce((sum, result) => sum + result.countOfStars, 0);
      const averageStars = totalStars / results.length;
      
      const sortedByStars = [...results].sort((a, b) => b.countOfStars - a.countOfStars);
      const bestResult = sortedByStars[0];
      const worstResult = sortedByStars[sortedByStars.length - 1];

      return {
        totalLessons: results.length,
        completedLessons: results.length,
        averageStars,
        bestResult,
        worstResult,
      };
    } catch (error: any) {
      console.error("Get lesson stats error:", error.message);
      throw new Error("Failed to get lesson statistics");
    }
  }
}