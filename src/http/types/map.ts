export type MapElementType = 'circle' | 'image' | 'lesson' | 'text' | 'checkpoint' | 'emoji';
export type MapPositioning = 'left' | 'center' | 'right' | 'free';

export interface MapBreakpointSettings {
  hidden?: boolean;
  positioning?: MapPositioning;
  offset?: {
    x: number;
    y: number;
  };
}

export interface MapElementResponse {
  id: string;
  type: MapElementType;
  title?: string;
  text?: string;
  color?: string;
  imageUrl?: string;
  emoji?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  positionX: number;
  positionY: number;
  positioning: MapPositioning;
  offsetX: number;
  offsetY: number;
  width?: number;
  height?: number;
  rotation?: number;
  isActive?: boolean;
  stars?: number;
  breakpoints?: Record<string, MapBreakpointSettings>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMapElementRequest {
  type: MapElementType;
  title?: string;
  text?: string;
  color?: string;
  imageUrl?: string;
  emoji?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  positionX: number;
  positionY: number;
  positioning: MapPositioning;
  offsetX: number;
  offsetY: number;
  width?: number;
  height?: number;
  rotation?: number;
  isActive?: boolean;
  stars?: number;
  breakpoints?: Record<string, MapBreakpointSettings>;
}

export interface UpdateMapElementRequest {
  title?: string;
  text?: string;
  color?: string;
  imageUrl?: string;
  emoji?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  positionX?: number;
  positionY?: number;
  positioning?: MapPositioning;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  isActive?: boolean;
  stars?: number;
  breakpoints?: Record<string, MapBreakpointSettings>;
}

export interface CourseMapResponse {
  id: string;
  courseId: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundRepeat: string;
  backgroundSize: string;
  elements: MapElementResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseMapRequest {
  courseId: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
}

export interface UpdateCourseMapRequest {
  width?: number;
  height?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundRepeat?: string;
  backgroundSize?: string;
}