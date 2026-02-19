export type UserGender = 'male' | 'female' | 'other' | 'na';

export interface User {
  id: string; // uuid
  name: string;
  email: string;
  gender?: UserGender;
  total_xp: number;
  totalXp?: number; // Backend documentation uses this
  current_streak: number;
  birthDate?: string; // date
  fcm_token?: string;
  created_at: string; // timestamp
  updated_at: string; // timestamp
  last_login_at?: string; // timestamp
}

export interface UserUpdateDto {
  name?: string;
  gender?: UserGender;
  birthDate?: string;
  fcm_token?: string;
}

