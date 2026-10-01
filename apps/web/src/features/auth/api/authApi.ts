import type {
  AuthApi,
  ForgotPasswordInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  ResetPasswordInput,
  User,
} from '@/features/auth/types';
import { apiClient } from '@/shared/api';

const AUTH = '/api/v1/auth';
const USERS = '/api/v1/users';

export const authApiReal: AuthApi = {
  async register(input: RegisterInput) {
    const { data } = await apiClient.post<{ user_id: string }>(`${AUTH}/register`, input);
    return data;
  },

  async verifyEmail(token: string) {
    await apiClient.post(`${AUTH}/verify`, { token });
  },

  async resendVerification(email: string) {
    await apiClient.post(`${AUTH}/resend-verification`, { email });
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(`${AUTH}/login`, input);
    return data;
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(`${AUTH}/refresh`, {
      refresh_token: refreshToken,
    });
    return data;
  },

  async logout(refreshToken: string) {
    await apiClient.post(`${AUTH}/logout`, { refresh_token: refreshToken });
  },

  async forgotPassword(input: ForgotPasswordInput) {
    await apiClient.post(`${AUTH}/forgot-password`, input);
  },

  async resetPassword(input: ResetPasswordInput) {
    await apiClient.post(`${AUTH}/reset-password`, input);
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>(`${USERS}/me`);
    return data;
  },
};
