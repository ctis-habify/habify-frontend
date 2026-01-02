import { Routine, RoutineList, RoutineLog } from '../types/routine';
import { api } from './api';
const API_URL = 'http://localhost:3000';

export type UpdateRoutinePayload = Partial<{
  routineListId: number;
  routineName: string;
  frequencyType: 'Daily' | 'Weekly' | string;
  frequencyDetail: number;
  startTime: string;
  endTime: string;
  isAiVerified: boolean;
  startDate: string;
  isReminderEnabled: boolean;
  reminderTime: string;
}>;

export const routineService = {
  // Get all routines for the authenticated user
  async getRoutines(): Promise<Routine[]> {
    const res = await api.get('/routines');
    return res.data;
  },
// Today's routines
  async getTodayRoutines(): Promise<Routine[]> {
    const res = await api.get('/routines/today');
    return res.data; // backend 'data' içinde döndürüyorsa: res.data.data
  },

  // Get grouped routines
    async getGroupedRoutines(): Promise<RoutineList[]> {
      const res = await api.get('/routines/grouped'); 
      return res.data;
    },

  // Get routine by ID
  async getRoutineById(routineId: string, token: string): Promise<Routine> {
    const res = await api.get(`/routines/${routineId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  
  // Get routine lists (routine groups)
  async getRoutineLists(): Promise<RoutineList[]> {
    const res = await api.get('/routine_lists');
    return res.data;
  },
  async getRoutineLogs(routineId?: string): Promise<RoutineLog[]> {
    const endpoint = routineId ? `/routines/${routineId}/logs` : '/routine-logs';
    const res = await api.get(endpoint);
    return res.data;
  },
   // ✅ Create Routine List
  async createRoutineList(categoryId: number, title: string) {
    const res = await api.post('/routine_lists', {
      title,
      categoryId,         
    });
    return res.data;        
  },

  // ✅ Create Routine
  async createRoutine(body: {
    routineListId: number;
    routineName: string;
    frequencyType: string;
    frequencyDetail?: number;
    startTime: string;
    endTime: string;
    isAiVerified: boolean;
    startDate: string;
  }) {
    // DTO: CreateRoutineDto ile birebir aynı alanlar
    const res = await api.post('/routines', body);
    return res.data;
  },

  // Create routine log (mark routine as completed)
  async createRoutineLog(
    routineId: string,
    logDate: string,
    verificationImageUrl?: string,
  ): Promise<RoutineLog> {
    const res = await api.post('/routine-logs', {
      routine_id: routineId,
      log_date: logDate,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },

  // Update routine log verification
  async updateRoutineLog(
    logId: number,
    isVerified: boolean,
    verificationImageUrl?: string,
  ): Promise<RoutineLog> {
    const res = await api.patch(`/routine-logs/${logId}`, {
      is_verified: isVerified,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },

  async updateRoutine(id: string, payload: UpdateRoutinePayload, token: string) {
    console.log("UPDATE PAYLOAD (Input): ", payload);
    
    // Map to snake_case for backend
    const snakePayload: any = {};
    if (payload.routineListId !== undefined) snakePayload.routine_list_id = payload.routineListId;
    if (payload.routineName !== undefined) snakePayload.routine_name = payload.routineName;
    if (payload.frequencyType !== undefined) snakePayload.frequency_type = payload.frequencyType;
    if (payload.frequencyDetail !== undefined) snakePayload.frequency_detail = payload.frequencyDetail;
    if (payload.startTime !== undefined) snakePayload.start_time = payload.startTime;
    if (payload.endTime !== undefined) snakePayload.end_time = payload.endTime;
    if (payload.isAiVerified !== undefined) snakePayload.is_ai_verified = payload.isAiVerified;
    if (payload.startDate !== undefined) snakePayload.start_date = payload.startDate;
    if (payload.isReminderEnabled !== undefined) snakePayload.is_reminder_enabled = payload.isReminderEnabled;
    if (payload.reminderTime !== undefined) snakePayload.reminder_time = payload.reminderTime;

    console.log("UPDATE PAYLOAD (Sent): ", snakePayload);

    const response = await api.patch(`${API_URL}/routines/${id}`, snakePayload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) throw new Error('Failed to update routine');
    return response;
  },

  async deleteRoutine(id: string, token: string) {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to delete routine');
    return true; // Success
  },
};
