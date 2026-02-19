export type FrequencyType = 'DAILY' | 'WEEKLY';

export interface Routine {
  is_ai_verified: boolean;
  routineName?: string;
  title: string;
  id: string; // uuid
  routineListId: number;
  frequencyDetail?: number;
  startTime: string; // time without time zone (HH:MM:SS)
  endTime: string; // time without time zone (HH:MM:SS)
  startDate: string; // date (YYYY-MM-DD)
  isDone: boolean;
  isCompleted?: boolean;
  isFailed: boolean;
  user_id: string;
  frequencyType: string;
  remainingLabel: string;
  remainingMinutes: number;
  categoryName: string;
  streak: number;
  missedCount: number;
  isReminderEnabled: boolean;
  reminderTime?: string;
  collaborativeKey?: string;
  creatorId?: string;
  routineType?: 'personal' | 'collaborative';
  description?: string;
  lives?: number;
  isPublic?: boolean;
  rewardCondition?: string;
  ageRequirement?: number;
  genderRequirement?: 'female' | 'male' | 'other' | 'na';
  xpRequirement?: number;
  completionXp?: number;
}

export interface RoutineList {
  id: number;
  user_id: string; // uuid
  categoryId: number;
  categoryName: string
  routineListTitle: string;
  created_at: string; // timestamp
  routines: Routine[];
}

export interface RoutineLog {
  id: number;
  routine_id: string; // uuid
  user_id: string; // uuid
  log_date: string; // date
  isAiVerified: boolean;
  verification_image_url?: string;
}

export interface CreateRoutineDto {
  routineListId: number;
  categoryId: number;
  routineName: string;
  startTime: string; // HH:MM:SS format
  endTime: string; // HH:MM:SS format
  startDate: string; // YYYY-MM-DD format
  frequencyType: string;
  frequencyDetail?: number;
  isAiVerified: boolean;
  isCollaborative?: boolean;
  description?: string;
  lives?: number;
  isPublic?: boolean;
  rewardCondition?: string;
  repetition?: string; // JSON string
  ageRequirement?: number;
  genderRequirement?: 'female' | 'male' | 'other' | 'na';
  xpRequirement?: number;
  completionXp?: number;
}

export interface UpdateRoutineDto {
  routineListId?: number;
  startTime?: string;
  endTime?: string;
  frequencyType?: string;
  frequencyDetail?: number;
}

export interface TodayScreenResponse {
  streak: number;
  routines: Routine[];
}