export type Role = 'patient' | 'professional' | 'admin' | 'caregiver';

export type UserStatus = 'pending_verification' | 'active' | 'suspended';

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  status: UserStatus;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
  role: Extract<Role, 'patient' | 'professional'>;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  new_password: string;
};

export type LoginResponse = {
  user: User;
  tokens: AuthTokens;
};

export type AuthApi = {
  register: (input: RegisterInput) => Promise<{ user_id: string }>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  login: (input: LoginInput) => Promise<LoginResponse>;
  refresh: (refreshToken: string) => Promise<LoginResponse>;
  logout: (refreshToken: string) => Promise<void>;
  forgotPassword: (input: ForgotPasswordInput) => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  getMe: () => Promise<User>;
};
