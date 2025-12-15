export type FrequencyType = 'DAILY' | 'WEEKLY';

export interface Routine {
  id: string; // uuid
  routineName: string
  routineListId: number;
  frequency_detail?: number;
  startTime: string; // time without time zone (HH:MM:SS)
  endTime: string; // time without time zone (HH:MM:SS)
  startDate: string; // date (YYYY-MM-DD)
  isDone: boolean;
  // user_id: string;
  frequencyType: string;
  remainingLabel: string;
  remainingMinutes: number;
}

export interface RoutineList {
  id: number;
  user_id: string; // uuid
  category_id: number;
  categoryName: string
  title: string;
  created_at: string; // timestamp
  routines: Routine[];
}

export interface RoutineLog {
  id: number;
  routine_id: string; // uuid
  user_id: string; // uuid
  log_date: string; // date
  is_verified: boolean;
  verification_image_url?: string;
}

export interface CreateRoutineDto {
  routine_group_id: number;
  category_id: number;
  title: string;
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  start_date: string; // YYYY-MM-DD format
  frequency_type: string;
  frequency_detail?: number;
}

export interface UpdateRoutineDto {
  routine_group_id?: number;
  start_time?: string;
  end_time?: string;
  frequency_type?: string;
  frequency_detail?: number;
}

