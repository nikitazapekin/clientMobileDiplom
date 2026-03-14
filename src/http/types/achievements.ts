export enum AchievementType {
  STUDENT_RESULTS = 'student_results',
  SOLVED_TASKS = 'solved_tasks',
}

export enum AchievementTier {
  // Student Results achievements (based on countOfStars)
  NOVICE = 'novice',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  MASTER = 'master',

  // Solved Tasks achievements (based on count of solved tasks)
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  PROFESSIONAL = 'professional',
  LEGENDARY = 'legendary',
}

export interface Achievement {
  id: string;
  clientId: string;
  type: AchievementType;
  tier: AchievementTier;
  title: string;
  description: string;
  image: string;
  earnedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface AchievementProgress {
  studentResults: {
    current: number;
    thresholds: { tier: AchievementTier; required: number }[];
  };
  solvedTasks: {
    current: number;
    thresholds: { tier: AchievementTier; required: number }[];
  };
}

export interface AchievementDefinition {
  title: string;
  description: string;
  image: string;
  type: AchievementType;
  threshold: number;
}

export interface AchievementDefinitions {
  novice: AchievementDefinition;
  advanced: AchievementDefinition;
  expert: AchievementDefinition;
  master: AchievementDefinition;
  beginner: AchievementDefinition;
  intermediate: AchievementDefinition;
  professional: AchievementDefinition;
  legendary: AchievementDefinition;
}
