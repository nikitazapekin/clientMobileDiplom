export interface CheckpointResponse {
  id: string;
  mapElementId: string;
  title: string;
  description: string;
  type: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimit?: number;
  instructions?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCheckpointRequest {
  mapElementId: string;
  title: string;
  description: string;
  type: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimit?: number;
  instructions?: string;
  isPublished?: boolean;
}

export interface UpdateCheckpointRequest {
  title?: string;
  description?: string;
  type?: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimit?: number;
  instructions?: string;
  isPublished?: boolean;
}
