import type { FeishuUser } from '../types/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'rt_access_token',
  REFRESH_TOKEN: 'rt_refresh_token',
  EXPIRES_AT: 'rt_expires_at',
  REFRESH_EXPIRES_AT: 'rt_refresh_expires_at',
  USER: 'rt_user',
} as const;

export interface StoredAuth {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  refreshExpiresAt: number | null;
  user: FeishuUser | null;
}

export function saveAuth(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  user: FeishuUser;
}): void {
  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(now + data.expires_in * 1000));
  localStorage.setItem(STORAGE_KEYS.REFRESH_EXPIRES_AT, String(now + data.refresh_expires_in * 1000));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
}

export function updateTokens(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}): void {
  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(now + data.expires_in * 1000));
  localStorage.setItem(STORAGE_KEYS.REFRESH_EXPIRES_AT, String(now + data.refresh_expires_in * 1000));
}

export function loadAuth(): StoredAuth {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
  const refreshExpiresAtStr = localStorage.getItem(STORAGE_KEYS.REFRESH_EXPIRES_AT);
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
    refreshExpiresAt: refreshExpiresAtStr ? parseInt(refreshExpiresAtStr, 10) : null,
    user: userStr ? JSON.parse(userStr) : null,
  };
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function isTokenExpired(): boolean {
  const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
  if (!expiresAtStr) return true;
  // 提前 5 分钟认为过期
  return Date.now() > parseInt(expiresAtStr, 10) - 5 * 60 * 1000;
}

export function isRefreshTokenExpired(): boolean {
  const refreshExpiresAtStr = localStorage.getItem(STORAGE_KEYS.REFRESH_EXPIRES_AT);
  if (!refreshExpiresAtStr) return true;
  return Date.now() > parseInt(refreshExpiresAtStr, 10);
}
