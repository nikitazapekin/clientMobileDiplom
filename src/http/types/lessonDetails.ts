export interface SlideBlock {
  id: string;
  order: number;
  type: string;
  [key: string]: unknown;
}

export interface Slide {
  id: string;
  title: string;
  type: "lesson" | "test";
  orderIndex: number;
  blocks: SlideBlock[];
}

export interface LessonDetailsResponse {
  id: string;
  lessonId: string;
  slides: Slide[];
  tests: Slide[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlideDto {
  title: string;
  type: "lesson" | "test";
  orderIndex: number;
  blocks?: object[];
}

export interface CreateTestDto {
  title: string;
  orderIndex: number;
  blocks?: object[];
}

export interface CreateLessonDetailsRequest {
  lessonId: string;
  slides?: CreateSlideDto[];
  tests?: CreateTestDto[];
}

export interface UpdateSlideDto extends CreateSlideDto {
  id?: string;
}

export interface UpdateTestDto extends CreateTestDto {
  id?: string;
}

export interface UpdateLessonDetailsRequest {
  slides?: UpdateSlideDto[];
  tests?: UpdateTestDto[];
}
