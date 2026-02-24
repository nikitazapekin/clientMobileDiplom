// http/codeService.ts
import $api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CodeLanguage = "javascript" | "python" | "csharp" | "golang" | "java";

export interface ExecuteCodeRequest {
  language: CodeLanguage;
  code: string;
}

export interface ExecuteCodeResponse {
  output: string;
  /** Compile or runtime error from server (stderr). */
  error?: string;
}

export class CodeService {
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  static async executeCode(data: ExecuteCodeRequest): Promise<ExecuteCodeResponse> {
    try {
      const token = await this.getToken();

      const response = await $api.post(
        "/code/execute",
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
      console.error("Execute code error:", error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Не удалось выполнить код";

      return { output: "", error: `Ошибка: ${message}` };
    }
  }
}