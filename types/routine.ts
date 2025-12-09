export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Routine {
  id: string; // uuid
  routine_group_id: number;
  frequency_detail?: number;
  start_time: string; // time without time zone (HH:MM:SS)
  end_time: string; // time without time zone (HH:MM:SS)
  is_ai_verified: boolean;
  user_id: string;
  frequency_type: FrequencyType;
}

export interface RoutineList {
  id: number;
  user_id: string; // uuid
  category_id: number;
  title: string;
  created_at: string; // timestamp
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
  frequency_type: FrequencyType;
  frequency_detail?: number;
}

export interface UpdateRoutineDto {
  routine_group_id?: number;
  start_time?: string;
  end_time?: string;
  frequency_type?: FrequencyType;
  frequency_detail?: number;
}

