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
  async createRoutineList(categoryId: number, title: string): Promise<RoutineList> {
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
  }): Promise<Routine> {
    const res = await api.post('/routines', body);
    return res.data;
  },

  // ✅ Create Collaborative Routine
  async createCollaborativeRoutine(body: {
    routineListId?: number;
    categoryId?: number;
    routineName: string;
    frequencyType: string;
    frequencyDetail?: number;
    startTime: string;
    endTime: string;
    startDate: string;
    isAiVerified?: boolean;
    routineType?: string;
    description?: string;
    lives?: number;
    isPublic?: boolean;
    entranceCondition?: string;
    rewardCondition?: string;
    repetition?: string;
    ageRequirement?: number;
    genderRequirement?: string;
    xpRequirement?: number;
  }): Promise<Routine> {
    const res = await api.post('/routines/collaborative', body);
    return res.data;
  },

  // ✅ Get Collaborative Routines
  async getCollaborativeRoutines(): Promise<Routine[]> {
    const res = await api.get('/routines/collaborative');
    return res.data;
  },

  // ✅ Join a Group
  async joinGroup(key: string): Promise<any> {
    try {
      const res = await api.post('/routines/join', { key });
      return res.data;
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  },

  // ✅ Group Detail (Profile View)
  async getGroupDetail(id: string): Promise<Routine & { participants: any[] }> {
    const res = await api.get(`/routines/group/${id}`);
    return res.data;
  },

  // ✅ Unified Verification Flow
  async verifyRoutine(body: { 
    routineId: string; 
    objectPath: string; 
  }): Promise<any> {
    const res = await api.post('/routines/verify', body);
    return res.data;
  },

  // Create routine log (mark routine as completed) - LEGACY (Consider using verifyRoutine)
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

  async updateRoutine(id: string, payload: UpdateRoutinePayload, token: string): Promise<any> {
    const response = await api.patch(`/routines/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) throw new Error('Failed to update routine');
    return response.data;
  },

  async deleteRoutine(id: string, token: string): Promise<boolean> {
    const response = await api.delete(`/routines/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200 && response.status !== 204) throw new Error('Failed to delete routine');
    return true; // Success
  },

  async deleteRoutineList(id: number, token: string): Promise<boolean> {
    const response = await api.delete(`/routine_lists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status !== 200 && response.status !== 204) throw new Error('Failed to delete routine list');
    return true;
  },

  async updateRoutineList(id: number, title: string, categoryId: number, token?: string): Promise<RoutineList> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.patch(`/routine_lists/${id}`, { title, categoryId }, config);
    return res.data;
  },
};
