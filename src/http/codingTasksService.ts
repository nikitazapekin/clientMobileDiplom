import type { ExpectedOutputValue } from "@/components/Lesson/types";
import $api from "./api";

export interface TestCase {
  input: string;
  expectedOutput: ExpectedOutputValue;
}

export interface CodeConstraint {
  type: string;
  value: any;
}

export interface CodeTask {
  id: string;
  title: string;
  description: string;
  languages: string[];
  startCodes: Record<string, string>;
  testCases: TestCase[];
  constraints: CodeConstraint[];
  difficulty: "easy" | "medium" | "hard";
  experienceReward: number;
  authorName: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitSolutionResult {
  allPassed: boolean;
  results: Array<{
    index: number;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
  }>;
  experienceGained: number;
  newLevel: number;
  newExperience: number;
  executionTimeMs: number;
  constraintsPassed?: boolean;
  constraintErrors?: string[];
}

export interface StudentLevel {
  id: string;
  clientId: string;
  level: number;
  experience: number;
  solvedTasks: Array<{ id: string; codeTaskId: string; solvedAt: string }>;
}

export interface CodeTaskSolution {
  id: string;
  code: string;
  language: string;
  executionTimeMs: number;
  passed: boolean;
  testCasesPassed: number;
  totalTestCases: number;
  testResults: any[];
  allPassed: boolean;
  experienceGained: number;
  studentLevelId: string;
  studentName: string;
  taskId: string;
  clientId: string;
  createdAt: string;
  likedBy?: string[];
  dislikedBy?: string[];
  likes?: number;
  dislikes?: number;
}

export interface TaskStatistics {
  totalSolutions: number;
  passedSolutions: number;
  averageExecutionTimeMs: number;
  fastestExecutionTimeMs: number;
  slowestExecutionTimeMs: number;
  languageStats: Array<{
    language: string;
    count: number;
    avgExecutionTimeMs: number;
    executionTimeDistribution: Array<{
      timeRange: string;
      count: number;
    }>;
  }>;
}

export interface UserRank {
  rank: number;
  executionTimeMs: number;
  totalParticipants: number;
}

export class CodingTasksService {
  static async getAllTasks(): Promise<CodeTask[]> {
    const response = await $api.get("/coding-tasks");
    return response.data;
  }

  static async getTask(id: string): Promise<CodeTask> {
    const response = await $api.get(`/coding-tasks/${id}`);
    return response.data;
  }

  static async getTasksByDifficulty(difficulty: string): Promise<CodeTask[]> {
    const response = await $api.get(`/coding-tasks/difficulty/${difficulty}`);
    return response.data;
  }

  static async submitSolution(
    taskId: string,
    code: string,
    language: string
  ): Promise<SubmitSolutionResult> {
    const response = await $api.post("/coding-tasks/submit", {
      taskId,
      code,
      language,
    });
    return response.data;
  }

  static async getStudentLevel(): Promise<StudentLevel> {
    const response = await $api.get("/coding-tasks/student-level");
    return response.data;
  }
 
  static async getStudentLevelByClientId(clientId: string): Promise<StudentLevel> {
    const response = await $api.get(`/coding-tasks/student-level/${clientId}`);
    return response.data;
  }

  static async getTaskSolutions(taskId: string): Promise<CodeTaskSolution[]> {
    const response = await $api.get(`/coding-tasks/${taskId}/solutions`);
    return response.data;
  }

  static async getTaskSolutionsByLanguage(
    taskId: string,
    language: string
  ): Promise<CodeTaskSolution[]> {
    const response = await $api.get(`/coding-tasks/${taskId}/solutions/language/${language}`);
    return response.data;
  }

  static async getTaskStatistics(taskId: string): Promise<TaskStatistics> {
    const response = await $api.get(`/coding-tasks/${taskId}/statistics`);
    return response.data;
  }

  static async getUserSolutions(): Promise<CodeTaskSolution[]> {
    const response = await $api.get("/coding-tasks/solutions/user");
    return response.data;
  }

  static async getExecutionTimeRanking(
    taskId: string,
    language: string
  ): Promise<Array<{ studentName: string; executionTimeMs: number; rank: number }>> {
    const response = await $api.get(`/coding-tasks/${taskId}/ranking/${language}`);
    return response.data;
  }

  static async getUserRank(taskId: string, language: string): Promise<UserRank> {
    const response = await $api.get(`/coding-tasks/${taskId}/rank/${language}`);
    return response.data;
  }

  static async likeSolution(solutionId: string): Promise<CodeTaskSolution> {
    const response = await $api.post(`/coding-tasks/solutions/${solutionId}/like`);
    return response.data;
  }

  static async dislikeSolution(solutionId: string): Promise<CodeTaskSolution> {
    const response = await $api.post(`/coding-tasks/solutions/${solutionId}/dislike`);
    return response.data;
  }
}
