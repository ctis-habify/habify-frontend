export type FrequencyType = 'DAILY' | 'WEEKLY';

export interface Routine {
  isAiVerified: boolean;
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
  userId: string;
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
  frequency?: string;
  repetition?: string;
  repeat?: string;
  rules?: {
    lives?: number;
    reward?: string;
    frequency?: string;
    time?: string;
  };
}

export interface RoutineList {
  id: number;
  userId: string;
  categoryId: number;
  categoryName: string
  routineListTitle: string;
  createdAt: string;
  routines: Routine[];
}

export interface RoutineLogUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface RoutineLog {
  id: number;
  routineId: string;
  userId: string;
  logDate: string;
  createdAt?: string;
  isAiVerified: boolean;
  isVerified?: boolean;
  verificationImageUrl?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  approvals?: (string | RoutineLogUser)[];
  rejections?: (string | RoutineLogUser)[];
  userName?: string;
  requiredApprovals?: number;
  approvalCount?: number;
  isCompletedByGroup?: boolean;
  completionXp?: number;
  submitterStreak?: number;
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

export interface PublicRoutine {
  id: string;
  routineName: string;
  description: string | null;
  category: string | null;
  categoryId: number;
  startDate: string; // YYYY-MM-DD
  frequencyType: string;
  memberCount: number;
  isAlreadyMember: boolean;
}