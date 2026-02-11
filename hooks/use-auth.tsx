import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { setAuthToken } from '../services/api';
import { authService } from '../services/auth.service';

// Backend'in döndürdüğü user tipini burada genişletebilirsin
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (_email: string, _password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'habify_access_token';
const USER_KEY = 'habify_user';

export const AuthProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        const getStoredItem = async (key: string) => {
          if (Platform.OS === 'web') {
            return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
          }
          return SecureStore.getItemAsync(key);
        };

        const storedToken = await getStoredItem(TOKEN_KEY);
        const storedUser = await getStoredItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken); // axios'a token'ı tanıt
        }

        if (storedUser) {
          const parsedUser: AuthUser = JSON.parse(storedUser);
          
          // Restore local avatar if missing
          if (!parsedUser.avatar && parsedUser.email) {
             const safeEmail = parsedUser.email.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_');
             const localAvatar = await SecureStore.getItemAsync(`avatar_${safeEmail}`);
             if (localAvatar) {
                 parsedUser.avatar = localAvatar;
             }
          }
          
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to restore auth state', error);
      } finally {
        setInitialized(true);
      }
    };

    restoreAuthState();
  }, []);

  const login = async (email: string, password: string, remember: boolean = true) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });

      const accessToken = data.accessToken;
      const loggedInUser: AuthUser = data.user;

      if (!accessToken || !loggedInUser) {
        throw new Error('Invalid login response from server');
      }

      // Check for local avatar override/fallback
      if (!loggedInUser.avatar && email) {
        const safeEmail = email.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_');
        const localAvatar = await SecureStore.getItemAsync(`avatar_${safeEmail}`);
        if (localAvatar) {
            loggedInUser.avatar = localAvatar;
        }
      }

      setToken(accessToken);
      setUser(loggedInUser);
      setAuthToken(accessToken);

      // Save to SecureStore only if remember is true
      if (remember) {
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(loggedInUser));
      } else {
        // If not remembering, ensure we clear any old persisted session just in case
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (error: unknown) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      setAuthToken(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    initialized,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
