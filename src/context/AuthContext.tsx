import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { authApi, User } from '../api/auth';
import { TOKEN_KEY, registerUnauthorizedHandler } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const router = useRouter();
  const segments = useSegments();

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Error deleting auth token:', e);
    }
    setToken(null);
    setUser(null);
  }, []);

  // Register the 401 unauth callback with axios client
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  // Restore session on app start
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await authApi.getMe();
          setUser(currentUser);
        }
      } catch (error) {
        console.warn('Session restoration failed:', error);
        // Invalid or expired token
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // Handle protected navigation routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User is not authenticated and not on login/register screen -> redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User is authenticated and on login/register screen -> redirect to Today (home)
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  const login = async (data: { email: string; password: string }) => {
    const result = await authApi.login(data);
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    router.replace('/(tabs)');
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const result = await authApi.register(data);
    // Auto-login upon registration
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    router.replace('/(tabs)');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

