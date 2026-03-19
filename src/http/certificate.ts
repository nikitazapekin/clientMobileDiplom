import { Platform, Linking, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import $api, { BASE_URL } from "./api";
 
export interface CertificateResponse {
  id: string;
  clientId: string;
  courseId: string;
  date: string;
  url: string;
  digital: string;
  isViewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificateRequest {
  auditoryId: string;
  courseId: string;
  date: string;
  courseName: string;
  studentName: string;
}

export interface UpdateCertificateRequest {
  date?: string;
  url?: string;
  digital?: string;
}

export class CertificateService {
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
        'Content-Type': 'application/json',
      },
    };
  }
 
  static async createCertificate(data: CreateCertificateRequest): Promise<CertificateResponse> {
    try {
      const token = await this.getToken();
      
      console.log("Creating certificate:", {
        auditoryId: data.auditoryId,
        studentName: data.studentName,
        courseName: data.courseName
      });

      const response = await $api.post(
        `/certificates`,
        data,
        this.getHeaders(token)
      );
      
      console.log("Certificate created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Create certificate error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to create certificate");
    }
  }

  static async setIsViewed(id: string): Promise<CertificateResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.put(
        `/certificates/setIsViewed`,
        { id },
        this.getHeaders(token)
      );
      return response.data;
    } catch (error: any) {
      console.error("setIsViewed error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to set isViewed");
    }
  }

  static getCertificateImageUrl(id: string): string {
    return `${BASE_URL}/certificates/${id}`;
  }
 
  static async getCertificatesByAuditoryId(auditoryId: string): Promise<CertificateResponse[]> {
    try {
      const token = await this.getToken();
      
      console.log("Fetching certificates for auditory:", auditoryId);
      
      const response = await $api.get(
        `/certificates/auditory/${auditoryId}`,
        this.getHeaders(token)
      );
      
      return response.data;
    } catch (error: any) {
      console.error("Get certificates error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch certificates");
    }
  }

  static async getCertificatesByClientId(clientId: string): Promise<CertificateResponse[]> {
    try {
      const token = await this.getToken();
      
      const response = await $api.get(
        `/certificates/client/${clientId}`,
        this.getHeaders(token)
      );
      
      return response.data;
    } catch (error: any) {
      console.error("Get certificates error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch certificates");
    }
  }


  
  static async createStudentCertificate(
    auditoryId: string,
    studentName: string,
    courseName: string,
    courseId: string
  ): Promise<CertificateResponse> {
    const data: CreateCertificateRequest = {
      auditoryId,
      courseId,
      studentName,
      courseName,
      date: new Date().toISOString().split('T')[0],
    };
    
    return this.createCertificate(data);
  }

  
  static async openDigitalVersion(id: string): Promise<void> {
    try {
      const imageUrl = this.getCertificateImageUrl(id);
      
      console.log(" Opening certificate:", imageUrl);
      
      const supported = await Linking.canOpenURL(imageUrl);
      
      if (supported) {
        await Linking.openURL(imageUrl);
      } else {
        Alert.alert("Ошибка", "Не удалось открыть ссылку");
      }
    } catch (error: any) {
      console.error(" Open certificate error:", error);
      Alert.alert("Ошибка", "Не удалось открыть сертификат");
    }
  }
 
  static async shareCertificate(id: string, title?: string): Promise<void> {
    try {
      const imageUrl = this.getCertificateImageUrl(id);
      
      console.log(" Sharing certificate URL:", imageUrl);
      
     
      console.log(" Certificate shared");
    } catch (error: any) {
      console.error(" Share certificate error:", error);
      
      if (error.message !== 'User cancelled') {
        Alert.alert("Ошибка", "Не удалось поделиться сертификатом");
      }
    }
  }
 
  static async saveToGallery(id: string): Promise<void> {
    try {
      const imageUrl = this.getCertificateImageUrl(id);
      
      console.log(" Saving to gallery:", imageUrl);
      
     
    } catch (error: any) {
      console.error(" Save to gallery error:", error);
      
      Alert.alert(
        "Ошибка сохранения",
        "Не удалось сохранить в галерею. Хотите открыть сертификат в браузере?",
        [
          { text: "Отмена", style: "cancel" },
          { 
            text: "Открыть в браузере", 
            onPress: () => this.openDigitalVersion(id)
          }
        ]
      );
    }
  }
}