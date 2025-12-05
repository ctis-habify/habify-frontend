// Auth store - basit bir yapı
// Daha detaylı auth yönetimi için auth.service.ts ve useAuth hook'u kullanılabilir

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

class AuthStore {
  private state: AuthState = {
    isAuthenticated: false,
    token: null,
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

  getState(): AuthState {
    return { ...this.state };
  }

  setAuth(token: string) {
    this.state.token = token;
    this.state.isAuthenticated = true;
    this.notify();
  }

  clearAuth() {
    this.state.token = null;
    this.state.isAuthenticated = false;
    this.notify();
  }
}

export const authStore = new AuthStore();

