// http/profile/ProfileService.ts

import { Platform } from "react-native";
import type { ImagePickerResponse } from "react-native-image-picker";
import { launchCamera,launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  AvatarResponse,
  CreateAvatarRequest,
  CreateStudentResultRequest,
  FullClientInfo,
  StudentProgress,
  StudentResultResponse,
  UpdateAvatarRequest,
  UpdateStudentResultRequest} from "./types/profile";
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
   * Создание аватара через base64 (РЕКОМЕНДУЕТСЯ ДЛЯ EXPO)
   */
  static async createAvatarBase64(auditoryId: string, base64Image: string, mimeType: string): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();

      const data: CreateAvatarRequest = {
        auditoryId,
        imageData: base64Image,
        mimeType: mimeType,
      };

      console.log('Creating avatar with base64:', {
        auditoryId,
        mimeType,
        base64Length: base64Image.length
      });

      const response = await $api.post(
        `/profile/avatar`,
        data,
        this.getHeaders(token)
      );

      console.log('Create avatar response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error("Create avatar base64 error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create avatar");
    }
  }

  /**
   * Обновление аватара через base64
   */
  static async updateAvatarBase64(avatarId: string, base64Image: string, mimeType: string): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();

      const data: UpdateAvatarRequest = {
        imageData: base64Image,
        mimeType: mimeType,
      };

      console.log('Updating avatar with base64:', {
        avatarId,
        mimeType,
        base64Length: base64Image.length
      });

      const response = await $api.put(
        `/profile/avatar/${avatarId}`,
        data,
        this.getHeaders(token)
      );

      console.log('Update avatar response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error("Update avatar base64 error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update avatar");
    }
  }

  /**
   * Обновление аватара по ID пользователя через base64
   */
  static async updateAvatarByAuditoryIdBase64(auditoryId: string, base64Image: string, mimeType: string): Promise<AvatarResponse> {
    try {
      const token = await this.getToken();

      const data: UpdateAvatarRequest = {
        imageData: base64Image,
        mimeType: mimeType,
      };

      console.log('Updating avatar by auditoryId with base64:', {
        auditoryId,
        mimeType,
        base64Length: base64Image.length
      });

      const response = await $api.put(
        `/profile/avatar/user/${auditoryId}`,
        data,
        this.getHeaders(token)
      );

      console.log('Update avatar by user response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error("Update avatar by user base64 error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update avatar");
    }
  }

  // http/profile/ProfileService.ts

  /**
 * Универсальный метод загрузки аватара (определяет создание или обновление)
 */
  static async uploadAvatarBase64(auditoryId: string, base64Image: string, mimeType: string): Promise<AvatarResponse> {
    try {
    // Проверяем, существует ли уже аватар
      let existingAvatar: AvatarResponse | null = null;

      try {
        existingAvatar = await this.getAvatarByAuditoryId(auditoryId);
        console.log('Existing avatar found:', existingAvatar?.id);
      } catch (error: any) {
      // Если ошибка 404 - аватара нет, создаем новый
        if (error.message.includes('not found')) {
          console.log('No existing avatar, will create new one');
        } else {
        // Другая ошибка - пробрасываем дальше
          throw error;
        }
      }

      if (existingAvatar) {
      // Обновляем существующий аватар
        console.log('Updating existing avatar with ID:', existingAvatar.id);

        return await this.updateAvatarByAuditoryIdBase64(auditoryId, base64Image, mimeType);
      } else {
      // Создаем новый аватар
        console.log('Creating new avatar');

        return await this.createAvatarBase64(auditoryId, base64Image, mimeType);
      }
    } catch (error: any) {
      console.error("Upload avatar base64 error:", error);
      throw error;
    }
  }
  /**
   * Загрузка аватара через multipart/form-data (старый метод, оставлен для совместимости)
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

      // @ts-ignore - FormData в React Native работает иначе
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `avatar_${Date.now()}.jpg`,
      });

      console.log('Uploading avatar with FormData:', {
        auditoryId,
        file: {
          uri: file.uri,
          type: file.type,
          name: file.name,
        }
      });

      const response = await $api.post('/profile/avatar/upload', formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('Upload response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error("Upload avatar error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to upload avatar");
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

      // Пробрасываем ошибку для обработки в вызывающем коде
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

  // ============= IMAGE PICKER METHODS =============

  /**
   * Выбрать изображение из галереи с base64
   */
  static async pickImageFromGalleryWithBase64(): Promise<{ base64: string; mimeType: string } | null> {
    return new Promise((resolve, reject) => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.7,
          maxWidth: 500,
          maxHeight: 500,
          includeBase64: true,
          selectionLimit: 1,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorCode) {
            reject(new Error(response.errorMessage || 'Failed to pick image'));
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];

            if (asset.base64) {
              resolve({
                base64: asset.base64,
                mimeType: asset.type || 'image/jpeg',
              });
            } else {
              reject(new Error('No base64 data in response'));
            }
          }
        }
      );
    });
  }

  /**
   * Сделать фото с камеры с base64
   */
  static async takePhotoWithCameraWithBase64(): Promise<{ base64: string; mimeType: string } | null> {
    return new Promise((resolve, reject) => {
      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.7,
          maxWidth: 500,
          maxHeight: 500,
          includeBase64: true,
          saveToPhotos: true,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            resolve(null);
          } else if (response.errorCode) {
            reject(new Error(response.errorMessage || 'Failed to take photo'));
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];

            if (asset.base64) {
              resolve({
                base64: asset.base64,
                mimeType: asset.type || 'image/jpeg',
              });
            } else {
              reject(new Error('No base64 data in response'));
            }
          }
        }
      );
    });
  }

  /**
   * Загрузить аватар с base64 (рекомендуемый метод)
   */
  static async uploadAvatarWithBase64(
    auditoryId: string,
    imageSource: 'gallery' | 'camera'
  ): Promise<AvatarResponse> {
    try {
      // Выбираем изображение с base64
      const imageData = imageSource === 'gallery'
        ? await this.pickImageFromGalleryWithBase64()
        : await this.takePhotoWithCameraWithBase64();

      if (!imageData) {
        throw new Error('No image selected');
      }

      console.log('Selected image with base64:', {
        mimeType: imageData.mimeType,
        base64Length: imageData.base64.length
      });

      // Загружаем через base64
      const response = await this.uploadAvatarBase64(
        auditoryId,
        imageData.base64,
        imageData.mimeType
      );

      console.log('Upload successful:', response);

      return response;
    } catch (error: any) {
      console.error('Upload avatar with base64 error:', error.message);
      throw error;
    }
  }
}
