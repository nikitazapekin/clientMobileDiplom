import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CheckpointResponse, UpdateCheckpointRequest, CreateCheckpointRequest } from "./types/checkpoint";
import $api from "./api";

export class CheckpointService {
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

  static async createCheckpoint(data: CreateCheckpointRequest): Promise<CheckpointResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(`/checkpoints`, data, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Create checkpoint error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create checkpoint");
    }
  }

  static async getCheckpoint(id: string): Promise<CheckpointResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/checkpoints/${id}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Get checkpoint error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch checkpoint");
    }
  }

  static async getCheckpointByMapElementId(mapElementId: string): Promise<CheckpointResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.get(`/checkpoints/map-element/${mapElementId}`, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Get checkpoint by map element id error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch checkpoint");
    }
  }

  static async updateCheckpoint(
    id: string,
    data: UpdateCheckpointRequest
  ): Promise<CheckpointResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(`/checkpoints/${id}`, data, this.getHeaders(token));
      return response.data;
    } catch (error: any) {
      console.error("Update checkpoint error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to update checkpoint");
    }
  }

  static async deleteCheckpoint(id: string): Promise<{ success: boolean }> {
    try {
      const token = await this.getToken();
      await $api.delete(`/checkpoints/${id}`, this.getHeaders(token));
      return { success: true };
    } catch (error: any) {
      console.error("Delete checkpoint error:", error.response?.data || error.message);

      if (error.response?.status === 404) {
        return { success: true };
      }

      throw new Error(error.response?.data?.message || "Failed to delete checkpoint");
    }
  }
}