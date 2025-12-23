export type FrequencyType = 'DAILY' | 'WEEKLY';

export interface Routine {
  is_ai_verified: boolean;
  routine_name?: string;
  title(arg0: string, title: any, arg2: string, label: string, arg4: string, minsLeft: number): unknown;
  id: string; // uuid
  routineListId: number;
  frequency_detail?: number;
  start_time: string; // time without time zone (HH:MM:SS)
  end_time: string; // time without time zone (HH:MM:SS)
  start_date: string; // date (YYYY-MM-DD)
  isDone: boolean;
  isFailed: boolean;
  user_id: string;
  frequency_type: string;
  remainingLabel: string;
  remainingMinutes: number;
  categoryName: string;
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
  title: string;
  startTime: string; // HH:MM:SS format
  endTime: string; // HH:MM:SS format
  startDate: string; // YYYY-MM-DD format
  frequencyType: string;
  frequencyDetail?: number;
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