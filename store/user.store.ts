import { User } from '../types/user';
import { userService } from '../services/user.service';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

class UserStore {
  private state: UserState = {
    user: null,
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

  getState(): UserState {
    return { ...this.state };
  }

  async fetchCurrentUser() {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      this.state.user = await userService.getCurrentUser();
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to fetch user';
      this.state.user = null;
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  async updateUser(data: Parameters<typeof userService.updateUser>[0]) {
    this.state.isLoading = true;
    this.state.error = null;
    this.notify();

    try {
      this.state.user = await userService.updateUser(data);
      this.state.error = null;
    } catch (error: any) {
      this.state.error = error.message || 'Failed to update user';
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  setUser(user: User | null) {
    this.state.user = user;
    this.notify();
  }

  clearUser() {
    this.state.user = null;
    this.state.error = null;
    this.notify();
  }
}

export const userStore = new UserStore();

