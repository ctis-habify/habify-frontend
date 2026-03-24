import { User } from './user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  fcmToken?: string;
  birthDate?: string;
  gender?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
