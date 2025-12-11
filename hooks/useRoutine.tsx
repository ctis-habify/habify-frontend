import { useEffect, useState } from 'react';
import { routinesStore } from '../store/routines.store';
import {
    CreateRoutineDto,
    UpdateRoutineDto,
} from '../types/routine';

export const useRoutine = () => {
  const [state, setState] = useState(routinesStore.getState());

  useEffect(() => {
    const unsubscribe = routinesStore.subscribe(() => {
      setState(routinesStore.getState());
    });

    return unsubscribe;
  }, []);

  return {
    routines: state.routines,
    routineLists: state.routineLists,
    routineLogs: state.routineLogs,
    isLoading: state.isLoading,
    error: state.error,
    fetchRoutines: () => routinesStore.fetchRoutines(),
    fetchRoutineLists: () => routinesStore.fetchRoutineLists(),
    fetchRoutineLogs: (routineId?: string) =>
      routinesStore.fetchRoutineLogs(routineId),
    createRoutine: (data: CreateRoutineDto) =>
      routinesStore.createRoutine(data),
    updateRoutine: (routineId: string, data: UpdateRoutineDto) =>
      routinesStore.updateRoutine(routineId, data),
    deleteRoutine: (routineId: string) => routinesStore.deleteRoutine(routineId),
    createRoutineList: (categoryId: number, title: string) =>
      routinesStore.createRoutineList(categoryId, title),
    createRoutineLog: (
      routineId: string,
      logDate: string,
      verificationImageUrl?: string
    ) => routinesStore.createRoutineLog(routineId, logDate, verificationImageUrl),
    clearRoutines: () => routinesStore.clearRoutines(),
  };
};
