import {
  CreateRoutineDto,
  Routine,
  RoutineList,
  RoutineLog
} from '../types/routine';
import { api } from './api';
const API_URL = 'http://localhost:3000';

export type UpdateRoutinePayload = Partial<Omit<Routine, 'id'>>;

export const routineService = {
  async getRoutines(token: string): Promise<Routine[]> {
    const response = await fetch(`${API_URL}/routines/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch routines');
    return response.json();
  },

  // Get routine by ID
  async getRoutineById (routineId: string): Promise<Routine> {
    const res = await api.get(`/routines/${routineId}`);
    return res.data;
  },
  
  async updateRoutine(id: string, payload: UpdateRoutinePayload, token: string) {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to update routine');
    return response.json();
  },

  async deleteRoutine(id: string, token: string) {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to delete routine');
    return true; // Success
  },

  async createRoutine (data: CreateRoutineDto): Promise<Routine> {
    const res = await api.post('/routines', data);
    return res.data;
  },

  // Get routine lists (routine groups)
  async getRoutineLists (): Promise<RoutineList[]> {
    const res = await api.get('/routine-lists');
    return res.data;
  },

  async createRoutineList (
    categoryId: number,
    title: string
  ): Promise<RoutineList> {
    const res = await api.post('/routine-lists', { category_id: categoryId, title });
    return res.data;
  },

  async getRoutineLogs (routineId?: string): Promise<RoutineLog[]> {
    const endpoint = routineId
      ? `/routines/${routineId}/logs`
      : '/routine-logs';
    const res = await api.get(endpoint);
    return res.data;
  },

  // Create routine log (mark routine as completed)
  async createRoutineLog (
    routineId: string,
    logDate: string,
    verificationImageUrl?: string ): Promise<RoutineLog>{
    const res = await api.post('/routine-logs', {
      routine_id: routineId,
      log_date: logDate,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },

  // Update routine log verification
  async updateRoutineLog (
    logId: number,
    isVerified: boolean,
    verificationImageUrl?: string
  ): Promise<RoutineLog> {
    const res = await api.patch(`/routine-logs/${logId}`, {
      is_verified: isVerified,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },
};

