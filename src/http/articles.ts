import type {
  Article,
  ArticlesListResponse,
  CommunityComment,
  CreateArticleCommentRequest,
  CreateArticleRequest,
  UpdateArticleCommentRequest,
  UpdateArticleRequest,
} from "./types/community";
import $api from "./api";

const getErrorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.message || error?.message || fallback;

class ArticlesApiService {
  async getArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
  }): Promise<ArticlesListResponse> {
    try {
      const response = await $api.get<ArticlesListResponse>("/articles", {
        params,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to load articles"));
    }
  }

  async getArticleById(id: string): Promise<Article> {
    try {
      const response = await $api.get<Article>(`/articles/${id}`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to load article"));
    }
  }

  async createArticle(payload: CreateArticleRequest): Promise<Article> {
    try {
      const response = await $api.post<Article>("/articles", payload);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to create article"));
    }
  }

  async updateArticle(id: string, payload: UpdateArticleRequest): Promise<Article> {
    try {
      const response = await $api.put<Article>(`/articles/${id}`, payload);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to update article"));
    }
  }

  async deleteArticle(id: string): Promise<{ success: boolean }> {
    try {
      const response = await $api.delete<{ success: boolean }>(`/articles/${id}`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to delete article"));
    }
  }

  async toggleLike(id: string): Promise<Article> {
    try {
      const response = await $api.post<Article>(`/articles/${id}/like`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to like article"));
    }
  }

  async toggleDislike(id: string): Promise<Article> {
    try {
      const response = await $api.post<Article>(`/articles/${id}/dislike`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to dislike article"));
    }
  }

  async createComment(
    articleId: string,
    payload: CreateArticleCommentRequest,
  ): Promise<CommunityComment> {
    try {
      const response = await $api.post<CommunityComment>(
        `/articles/${articleId}/comments`,
        payload,
      );

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to create comment"));
    }
  }

  async updateComment(
    id: string,
    payload: UpdateArticleCommentRequest,
  ): Promise<CommunityComment> {
    try {
      const response = await $api.put<CommunityComment>(`/articles/comments/${id}`, payload);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to update comment"));
    }
  }

  async deleteComment(id: string): Promise<{ success: boolean }> {
    try {
      const response = await $api.delete<{ success: boolean }>(`/articles/comments/${id}`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to delete comment"));
    }
  }

  async toggleCommentLike(id: string): Promise<CommunityComment> {
    try {
      const response = await $api.post<CommunityComment>(`/articles/comments/${id}/like`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to like comment"));
    }
  }

  async toggleCommentDislike(id: string): Promise<CommunityComment> {
    try {
      const response = await $api.post<CommunityComment>(`/articles/comments/${id}/dislike`);

      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Failed to dislike comment"));
    }
  }
}

export default new ArticlesApiService();
