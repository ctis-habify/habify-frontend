import {
  Routine,
  RoutineList,
  RoutineLog,
  CreateRoutineDto,
  UpdateRoutineDto,
} from '../types/routine';
import { routineService } from '../services/routine.service';

interface RoutinesState {
  routines: Routine[];
  routineLists: RoutineList[];
  routineLogs: RoutineLog[];
  isLoading: boolean;
  error: string | null;
}

class RoutinesStore {
  private state: RoutinesState = {
    routines: [],
    routineLists: [],
    routineLogs: [],
    isLoading: false,
    error: null,
  };

  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  getState(): RoutinesState {
    return { ...this.state };
  }

  async fetchRoutines() {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      this.state.routines = await routineService.getRoutines();
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to fetch routines';
      this.state.routines = [];
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async fetchRoutineLists() {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      this.state.routineLists = await routineService.getRoutineLists();
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to fetch routine lists';
      this.state.routineLists = [];
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async fetchRoutineLogs(routineId?: string) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      this.state.routineLogs = await routineService.getRoutineLogs(routineId);
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to fetch routine logs';
      this.state.routineLogs = [];
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async createRoutine(data: CreateRoutineDto) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const newRoutine = await routineService.createRoutine(data);
      this.state.routines.push(newRoutine);
      this.state.error = null;
      return newRoutine;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to create routine';
      throw error;
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async updateRoutine(routineId: string, data: UpdateRoutineDto) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const updatedRoutine = await routineService.updateRoutine(routineId, data);
      const index = this.state.routines.findIndex((r) => r.id === routineId);
      if (index !== -1) {
        this.state.routines[index] = updatedRoutine;
      }
      this.state.error = null;
      return updatedRoutine;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to update routine';
      throw error;
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async deleteRoutine(routineId: string) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      await routineService.deleteRoutine(routineId);
      this.state.routines = this.state.routines.filter(
        (r) => r.id !== routineId
      );
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to delete routine';
      throw error;
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async createRoutineList(categoryId: number, title: string) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const newList = await routineService.createRoutineList(categoryId, title);
      this.state.routineLists.push(newList);
      this.state.error = null;
      return newList;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to create routine list';
      throw error;
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async createRoutineLog(
    routineId: string,
    logDate: string,
    verificationImageUrl?: string
  ) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      const newLog = await routineService.createRoutineLog(
        routineId,
        logDate,
        verificationImageUrl
      );
      this.state.routineLogs.push(newLog);
      this.state.error = null;
      return newLog;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to create routine log';
      throw error;
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  clearRoutines() {
    this.state.routines = [];
    this.state.routineLists = [];
    this.state.routineLogs = [];
    this.state.error = null;
    this.notify();
  }
}

export const routinesStore = new RoutinesStore();

