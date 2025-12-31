import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { FeishuUser } from '../types/auth';
import {
  loadAuth,
  saveAuth,
  updateTokens,
  clearAuth,
  isTokenExpired,
  isRefreshTokenExpired,
} from '../lib/storage';

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: FeishuUser | null;
  accessToken: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

async function doRefreshToken(): Promise<{
  success: boolean;
  accessToken?: string;
}> {
  const stored = loadAuth();
  if (!stored.refreshToken) return { success: false };

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });

    if (!response.ok) {
      clearAuth();
      return { success: false };
    }

    const data = await response.json();
    updateTokens(data);
    return { success: true, accessToken: data.access_token };
  } catch {
    clearAuth();
    return { success: false };
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<FeishuUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const initialized = useRef(false);

  // 初始化时从 localStorage 加载
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = loadAuth();

    if (stored.accessToken && stored.user) {
      // 检查 refresh token 是否过期
      if (isRefreshTokenExpired()) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      // 检查 access token 是否需要刷新
      if (isTokenExpired() && stored.refreshToken) {
        doRefreshToken().then((result) => {
          if (result.success && result.accessToken) {
            setAccessToken(result.accessToken);
            setUser(stored.user);
          }
          setIsLoading(false);
        });
      } else {
        setAccessToken(stored.accessToken);
        setUser(stored.user);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const result = await doRefreshToken();
    if (result.success && result.accessToken) {
      setAccessToken(result.accessToken);
      return true;
    }
    setAccessToken(null);
    setUser(null);
    return false;
  }, []);

  const login = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const data = await response.json();
      saveAuth(data);
      setAccessToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: !!accessToken && !!user,
    isLoading,
    user,
    accessToken,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
