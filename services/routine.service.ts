import api from './api';
import {
  Routine,
  RoutineList,
  RoutineLog,
  CreateRoutineDto,
  UpdateRoutineDto,
} from '../types/routine';

export const routineService = {
  // Get all routines for current user
  getRoutines: async (): Promise<Routine[]> => {
    const res = await api.get('/routines');
    return res.data;
  },

  // Get routine by ID
  getRoutineById: async (routineId: string): Promise<Routine> => {
    const res = await api.get(`/routines/${routineId}`);
    return res.data;
  },

  // Create a new routine
  createRoutine: async (data: CreateRoutineDto): Promise<Routine> => {
    const res = await api.post('/routines', data);
    return res.data;
  },

  // Update routine
  updateRoutine: async (
    routineId: string,
    data: UpdateRoutineDto
  ): Promise<Routine> => {
    const res = await api.patch(`/routines/${routineId}`, data);
    return res.data;
  },

  // Delete routine
  deleteRoutine: async (routineId: string): Promise<void> => {
    await api.delete(`/routines/${routineId}`);
  },

  // Get routine lists (routine groups)
  getRoutineLists: async (): Promise<RoutineList[]> => {
    const res = await api.get('/routine-lists');
    return res.data;
  },

  // Create routine list
  createRoutineList: async (
    categoryId: number,
    title: string
  ): Promise<RoutineList> => {
    const res = await api.post('/routine-lists', { category_id: categoryId, title });
    return res.data;
  },

  // Get routine logs
  getRoutineLogs: async (routineId?: string): Promise<RoutineLog[]> => {
    const endpoint = routineId
      ? `/routines/${routineId}/logs`
      : '/routine-logs';
    const res = await api.get(endpoint);
    return res.data;
  },

  // Create routine log (mark routine as completed)
  createRoutineLog: async (
    routineId: string,
    logDate: string,
    verificationImageUrl?: string
  ): Promise<RoutineLog> => {
    const res = await api.post('/routine-logs', {
      routine_id: routineId,
      log_date: logDate,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },

  // Update routine log verification
  updateRoutineLog: async (
    logId: number,
    isVerified: boolean,
    verificationImageUrl?: string
  ): Promise<RoutineLog> => {
    const res = await api.patch(`/routine-logs/${logId}`, {
      is_verified: isVerified,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },
};

