import { Routine, RoutineList, RoutineLog } from '../types/routine';
import { api } from './api';


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
    async getGroupedRoutines(token?: string): Promise<RoutineList[]> {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await api.get('/routines/grouped', config); 
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
    
    // Send payload directly (camelCase) as backend expects
    console.log("UPDATE SERVICE PAYLOAD (Final):", JSON.stringify(payload, null, 2));

    const response = await api.patch(`/routines/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("UPDATE RESPONSE (Status):", response.status);
    console.log("UPDATE RESPONSE (Data):", JSON.stringify(response.data, null, 2));

    if (response.status !== 200) throw new Error('Failed to update routine');
    return response;
  },

  async deleteRoutine(id: string, token: string) {
    const response = await api.delete(`/routines/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200 && response.status !== 204) throw new Error('Failed to delete routine');
    return true; // Success
  },
};
