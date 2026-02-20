import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./types/auth";
import $api from "./api";

export default class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log("Attempting login...");
      // Бэкенд ожидает email, а не login
      const response = await $api.post<AuthResponse>("/auth/login", {
        email: credentials.login, // Преобразуем login в email
        password: credentials.password
      });

      console.log("Login response:", response.data);

      if (response.data.accessToken) {
        await AsyncStorage.setItem("accessToken", response.data.accessToken);
        await AsyncStorage.setItem("userRole", response.data.role);
        await AsyncStorage.setItem("userEmail", response.data.email);
        await AsyncStorage.setItem("userId", response.data.userId);
        await AsyncStorage.setItem("userFullName", response.data.fullName);
        console.log("Login successful, tokens saved");
      }

      return response.data;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Login failed");
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Приводим данные к формату, который ожидает бэкенд
      const registerData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName || "",
        phone: userData.phone,
        country: userData.country,
        description: userData.description || ""
      };

      const response = await $api.post<AuthResponse>("/auth/register", registerData);

      if (response.data.accessToken) {
        await AsyncStorage.setItem("accessToken", response.data.accessToken);
        await AsyncStorage.setItem("userRole", response.data.role);
        await AsyncStorage.setItem("userEmail", response.data.email);
        await AsyncStorage.setItem("userId", response.data.userId);
        await AsyncStorage.setItem("userFullName", response.data.fullName);
      }

      return response.data;
    } catch (error: any) {
      console.error("Registration error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  }

  static async refreshToken(): Promise<string> {
    try {
      // Refresh token автоматически отправляется через cookies
      const response = await $api.post<AuthResponse>("/auth/refresh");

      if (response.data.accessToken) {
        await AsyncStorage.setItem("accessToken", response.data.accessToken);
        return response.data.accessToken;
      }

      throw new Error("No access token in response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      await this.clearStorage();
      throw new Error("SESSION_EXPIRED");
    }
  }

  static async logout(): Promise<void> {
    try {
      await $api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await this.clearStorage();
    }
  }

  static async validateToken(): Promise<AuthResponse> {
    try {
      const response = await $api.get<AuthResponse>("/auth/validate");
      return response.data;
    } catch (error) {
      console.error("Token validation failed:", error);
      throw new Error("Token validation failed");
    }
  }

  static async getCurrentUser() {
    try {
      const [token, role, email, userId, fullName] = await Promise.all([
        AsyncStorage.getItem("accessToken"),
        AsyncStorage.getItem("userRole"),
        AsyncStorage.getItem("userEmail"),
        AsyncStorage.getItem("userId"),
        AsyncStorage.getItem("userFullName"),
      ]);

      if (!token) {
        return null;
      }

      return {
        accessToken: token,
        role,
        email,
        userId,
        fullName,
      };
    } catch {
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        return false;
      }

      // Проверяем валидность токена на сервере
      await this.validateToken();
      return true;
    } catch {
      return false;
    }
  }

  private static async clearStorage(): Promise<void> {
    await AsyncStorage.multiRemove([
      "accessToken", 
      "userRole", 
      "userEmail", 
      "userId",
      "userFullName"
    ]);
  }
}