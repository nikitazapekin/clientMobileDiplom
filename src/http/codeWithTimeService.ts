import AsyncStorage from "@react-native-async-storage/async-storage";

import $api from "./api";

export type CodeLanguage = "javascript" | "python" | "csharp" | "java";

export interface ExecuteCodeWithTimeRequest {
  language: CodeLanguage;
  code: string;
}

export interface ExecuteCodeWithTimeResponse {
  output: string;
  error?: string;
  executionTimeMs: number;
}

export class CodeWithTimeService {
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (error) {
      console.error("Error getting token:", error);

      return null;
    }
  }

  static async executeCodeWithTime(data: ExecuteCodeWithTimeRequest): Promise<ExecuteCodeWithTimeResponse> {
    try {
      const token = await this.getToken();

      const response = await $api.post(
        "/code-with-time/execute",
        {
          language: data.language,
          code: data.code,
        },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      );

      return response.data;
    } catch (error: any) {
      console.error("Execute code with time error:", error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Не удалось выполнить код";

      return { output: "", error: `Ошибка: ${message}`, executionTimeMs: 0 };
    }
  }
}
