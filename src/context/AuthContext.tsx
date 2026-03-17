import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { TOKEN_KEY, USER_KEY } from '@/lib/api/config';
import { APIProvider } from '@/lib/api/providers/BaseProvider';
import { VercelProxyProvider } from '@/lib/api/providers/VercelProxyProvider';

export interface User {
  id: number;
  name: string;
  email: string;
  partner_id: number;
  partner_name: string;
  role?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  isAdmin: boolean;
  apiProvider: APIProvider;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always use VercelProxyProvider for standalone mode
  const apiProvider = useMemo(() => new VercelProxyProvider(), []);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    console.log('[Auth] Initial load - token:', !!storedToken, 'user:', !!storedUser);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('[Auth] Restored session for:', parsedUser.name || parsedUser.email);
      } catch (e) {
        console.error('[Auth] Failed to parse stored user:', e);
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<AuthResult> => {
    console.log('[Auth] Login attempt for:', username);

    try {
      const response = await apiProvider.login(username, password);
      console.log('[Auth] Login response:', response);

      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;

        // Update state and storage
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));

        console.log('[Auth] Login successful, state updated');

        return { success: true };
      } else {
        console.log('[Auth] Login failed:', response.error);
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const logout = async () => {
    console.log('[Auth] Logging out...');
    try {
      await apiProvider.logout();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const clearAuth = () => {
    console.log('[Auth] Clearing auth state');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const checkAuth = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await apiProvider.verifyToken(token);
      return response.success && !!response.data?.user;
    } catch (error) {
      console.error('[Auth] Auth check failed:', error);
      return false;
    }
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    isAdmin,
    apiProvider,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
