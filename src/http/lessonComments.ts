import AsyncStorage from "@react-native-async-storage/async-storage";

import $api from "./api";

export interface LessonComment {
  id: string;
  lessonDetailsId: string;
  userId: string;
  content: string;
  parentId: string | null;
  likes: number;
  dislikes: number;
  likedByUsers: string[];
  dislikedByUsers: string[];
  createdAt: string;
  updatedAt: string;
  hasLiked: boolean;
  hasDisliked: boolean;
  replies?: LessonComment[];
}

export interface LessonCommentsWithMeta {
  comments: LessonComment[];
  total: number;
  canComment: boolean;
}

export interface CreateLessonCommentDto {
  lessonDetailsId: string;
  content: string;
  parentId?: string | null;
}

export default class LessonCommentsService {
  private static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem("accessToken");
  }

  /**
   * Получить все комментарии к уроку с древовидной структурой
   * @param lessonDetailsId - ID lesson_details
   */
  static async getCommentsByLessonDetailsId(
    lessonDetailsId: string
  ): Promise<LessonCommentsWithMeta> {
    try {
      const token = await this.getToken();
      const response = await $api.get<LessonCommentsWithMeta>(
        `/lesson-comments/lesson-details/${lessonDetailsId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
console.log(" Response data COMMMMMENSTSSS:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Get lesson comments error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch lesson comments");
    }
  }

  /**
   * Создать комментарий к уроку
   * @param dto - данные комментария
   */
  static async createComment(dto: CreateLessonCommentDto): Promise<LessonComment> {
    try {
      const token = await this.getToken();
      const response = await $api.post<LessonComment>(
        "/lesson-comments",
        dto,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Create lesson comment error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create lesson comment");
    }
  }

  /**
   * Обновить комментарий
   * @param id - ID комментария
   * @param content - новый текст комментария
   */
  static async updateComment(id: string, content: string): Promise<LessonComment> {
    try {
      const token = await this.getToken();
      const response = await $api.put<LessonComment>(
        `/lesson-comments/${id}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Update lesson comment error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update lesson comment");
    }
  }

  /**
   * Удалить комментарий
   * @param id - ID комментария
   */
  static async deleteComment(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      const response = await $api.delete<{ success: boolean }>(
        `/lesson-comments/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Delete lesson comment error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to delete lesson comment");
    }
  }

  /**
   * Поставить/убрать лайк комментарию
   * @param id - ID комментария
   */
  static async toggleLike(id: string): Promise<LessonComment> {
    try {
      const token = await this.getToken();
      const response = await $api.post<LessonComment>(
        `/lesson-comments/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Toggle like error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to toggle like");
    }
  }

  /**
   * Поставить/убрать дизлайк комментарию
   * @param id - ID комментария
   */
  static async toggleDislike(id: string): Promise<LessonComment> {
    try {
      const token = await this.getToken();
      const response = await $api.post<LessonComment>(
        `/lesson-comments/${id}/dislike`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Toggle dislike error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to toggle dislike");
    }
  }
}
