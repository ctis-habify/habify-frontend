export type UserGender = 'male' | 'female' | 'other' | 'na';

export interface User {
  id: string; // uuid
  name: string;
  email: string;
  gender?: UserGender;
  totalXp: number;
  currentStreak: number;
  birthDate?: string;
  avatar?: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserUpdateDto {
  name?: string;
  gender?: UserGender;
  birthDate?: string;
  avatar?: string;
  fcmToken?: string;
}

