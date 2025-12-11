import * as SecureStore from 'expo-secure-store';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Alert } from 'react-native';
import { setAuthToken } from '../services/api';
import { authService } from '../services/auth.service'; // kendi path'ine göre düzelt
  
  // Backend'in döndürdüğü user tipini burada genişletebilirsin
  export interface AuthUser {
    id: string;
    email: string;
    name?: string;

  }
  
  interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    initialized: boolean;
  }
  
  const AuthContext = createContext<AuthContextValue | undefined>(undefined);
  
  const TOKEN_KEY = 'habify_access_token';
  const USER_KEY = 'habify_user';
  
  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
  
    // Uygulama açıldığında token & user'ı SecureStore'dan yükle
    useEffect(() => {
      const restoreAuthState = async () => {
        try {
          const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
          const storedUser = await SecureStore.getItemAsync(USER_KEY);
  
          if (storedToken) {
            setToken(storedToken);
            setAuthToken(storedToken); // axios'a token'ı tanıt
          }
  
          if (storedUser) {
            const parsedUser: AuthUser = JSON.parse(storedUser);
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
  
    const login = async (email: string, password: string) => {
      setLoading(true);
      try {
        const data = await authService.login({ email, password });
  
        const accessToken = data.accessToken;
        const loggedInUser: AuthUser = data.user;
  
        if (!accessToken || !loggedInUser) {
          throw new Error('Invalid login response from server');
        }

        setToken(accessToken);
        setUser(loggedInUser);
        setAuthToken(accessToken);
  
        await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(loggedInUser));
      } catch (error: any) {
        console.error('Login failed:', error);
        Alert.alert(
          'Login failed',
          error?.response?.data?.message || error.message || 'Something went wrong',
        );
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