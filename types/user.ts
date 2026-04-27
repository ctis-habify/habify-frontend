export type UserGender = 'male' | 'female' | 'other' | 'na';

export interface User {
  id: string; // uuid
  name: string;
  email: string;
  gender?: UserGender;
  totalXp: number;
  currentStreak: number;
  birthDate?: string;
  fcmToken?: string;
  avatarUrl?: string | null;
  avatar?: string | null; // For legacy compatibility
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserUpdateDto {
  name?: string;
  gender?: UserGender;
  birthDate?: string;
  fcmToken?: string;
}

