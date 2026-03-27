export type CourseStatus = "draft" | "published" | "archived";

export interface CoursePreviewResponse {
  id: string;
  title: string;
  description: string;
  type: string;
  language: string;
  tags: string[];
  logo: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  type: string;
  language: string;
  tags?: string[];
  logo: string;
  status?: CourseStatus;
}

export type UpdateCourseRequest = Partial<CreateCourseRequest>;

export interface CourseListResponse {
  courses: CourseResponse[];
  total: number;
  page: number;
  pages: number;
}

export interface StudentCourseResponse extends CoursePreviewResponse {
  status: CourseStatus;
  subscribedAt: string;
  publishedAt?: string | null;
}

export interface CourseResponse extends CoursePreviewResponse {
  status: CourseStatus;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CourseStatsResponse {
  lessonCount: number;
  studentCount: number;
}
