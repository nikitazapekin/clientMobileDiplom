import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CourseMapResponse, CreateCourseMapRequest, CreateMapElementRequest, MapElementResponse, UpdateCourseMapRequest,UpdateMapElementRequest } from "./types/map";
import $api from "./api";

export class MapService {
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

  static async createCourseMap(data: CreateCourseMapRequest): Promise<CourseMapResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(`/course-maps`, data, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Create course map error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create course map");
    }
  }

  static async getCourseMapByCourseId(courseId: string): Promise<CourseMapResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/course-maps/course/${courseId}`, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Get course map by course id error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch course map");
    }
  }

  static async getCourseMapById(mapId: string): Promise<CourseMapResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/course-maps/${mapId}`, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Get course map by id error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch course map");
    }
  }

  static async updateCourseMap(id: string, data: UpdateCourseMapRequest): Promise<CourseMapResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(`/course-maps/${id}`, data, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Update course map error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update course map");
    }
  }

  static async deleteCourseMap(mapId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();

      await $api.delete(`/course-maps/${mapId}`, this.getHeaders(token));

      return { success: true };
    } catch (error: any) {
      console.error("Delete course map error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to delete course map");
    }
  }

  static async addMapElement(mapId: string, data: CreateMapElementRequest): Promise<MapElementResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(`/course-maps/${mapId}/elements`, data, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Add map element error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to add map element");
    }
  }

  static async getMapElements(mapId: string): Promise<MapElementResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/course-maps/${mapId}/elements`, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Get map elements error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch map elements");
    }
  }

  static async getMapElementById(elementId: string): Promise<MapElementResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/course-maps/elements/${elementId}`, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Get map element error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch map element");
    }
  }

  static async updateMapElement(
    elementId: string,
    data: UpdateMapElementRequest
  ): Promise<MapElementResponse> {
    try {
      const token = await this.getToken();

    
      if (elementId.startsWith("temp_")) {
        console.warn(" Попытка обновить элемент с временным ID:", elementId);
        throw new Error("Элемент еще не сохранен на сервере");
      }

      const response = await $api.put(`/course-maps/elements/${elementId}`, data, this.getHeaders(token));

      return response.data;
    } catch (error: any) {
      console.error("Update map element error:", error.response?.data || error.message);

       
      if (error.response?.status === 404) {
        console.error(`Элемент с ID ${elementId} не найден на сервере`);
        throw new Error(`Элемент с ID ${elementId} не найден. Возможно, он был удален.`);
      }

      throw new Error(error.response?.data?.message || "Failed to update map element");
    }
  }

  static async deleteMapElement(elementId: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();

      if (elementId.startsWith("temp_")) {
        console.warn(" Попытка удалить элемент с временным ID:", elementId);

        return { success: true };
      }

      await $api.delete(`/course-maps/elements/${elementId}`, this.getHeaders(token));

      return { success: true };
    } catch (error: any) {
      console.error("Delete map element error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };  
      }

      throw new Error(error.response?.data?.message || "Failed to delete map element");
    }
  }

  static async getElementsByType(mapId: string, type: string): Promise<MapElementResponse[]> {
    try {
      const elements = await this.getMapElements(mapId);

      return elements.filter(el => el.type === type);
    } catch (error) {
      console.error("Get elements by type error:", error);
      throw error;
    }
  }
}
