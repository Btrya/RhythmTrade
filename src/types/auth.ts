export interface FeishuUser {
  open_id: string;
  union_id: string;
  name: string;
  avatar_url: string;
  email?: string;
}

export interface FeishuTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: FeishuUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}
