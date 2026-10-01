import type {
  AuthApi,
  AuthTokens,
  ForgotPasswordInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  ResetPasswordInput,
  User,
  UserStatus,
} from '@/features/auth/types';
import { ApiError } from '@/shared/api';

type MockUser = User & {
  password: string;
};

type ActiveRefresh = {
  token: string;
  userId: string;
  expiresAt: number;
};

type PendingOneTime = {
  token: string;
  userId: string;
  purpose: 'email_verification' | 'password_reset';
  expiresAt: number;
};

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

const users = new Map<string, MockUser>();
const refreshTokens = new Map<string, ActiveRefresh>();
const oneTimeTokens = new Map<string, PendingOneTime>();

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const jitter = () => 120 + Math.floor(Math.random() * 230);

const randomToken = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const stripPassword = (user: MockUser): User => {
  const { password: _password, ...rest } = user;
  return rest;
};

const issueTokens = (userId: string): AuthTokens => {
  const accessToken = `mock.access.${userId}.${Date.now()}`;
  const refreshToken = randomToken();
  refreshTokens.set(refreshToken, {
    token: refreshToken,
    userId,
    expiresAt: Date.now() + REFRESH_TTL_MS,
  });
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

const buildLink = (path: string, token: string): string => {
  const base = window.location.origin;
  return `${base}${path}?token=${token}`;
};

const logEmail = (to: string, subject: string, link: string) => {
  console.info(
    `%c[mock email]%c to=${to} subject="${subject}"\n${link}`,
    'color: #0f7ea8; font-weight: bold;',
    'color: inherit;',
  );
};

const requireUserByEmail = (email: string): MockUser | undefined => users.get(email.toLowerCase());

const activeStatus = (status: UserStatus): boolean => status === 'active';

export const authApiMock: AuthApi = {
  async register(input: RegisterInput) {
    await delay(jitter());
    const email = input.email.toLowerCase();

    if (users.has(email)) {
      throw new ApiError({
        code: 'conflict',
        title: 'Conflict',
        detail: 'An account with this email already exists.',
        status: 409,
      });
    }

    const user: MockUser = {
      id: crypto.randomUUID(),
      email,
      full_name: input.full_name,
      role: input.role,
      status: 'pending_verification',
      password: input.password,
    };
    users.set(email, user);

    const token = randomToken();
    oneTimeTokens.set(token, {
      token,
      userId: user.id,
      purpose: 'email_verification',
      expiresAt: Date.now() + VERIFY_TTL_MS,
    });
    logEmail(email, 'Verify your account', buildLink('/verify', token));

    return { user_id: user.id };
  },

  async verifyEmail(token: string) {
    await delay(jitter());
    const record = oneTimeTokens.get(token);
    if (record?.purpose !== 'email_verification' || record.expiresAt < Date.now()) {
      throw new ApiError({
        code: 'invalid_token',
        title: 'Invalid token',
        detail: 'This verification link is invalid or has expired.',
        status: 400,
      });
    }

    const user = Array.from(users.values()).find((candidate) => candidate.id === record.userId);
    if (!user) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'User no longer exists.',
        status: 404,
      });
    }

    user.status = 'active';
    oneTimeTokens.delete(token);
  },

  async resendVerification(email: string) {
    await delay(jitter());
    const user = requireUserByEmail(email);
    if (user?.status !== 'pending_verification') return;

    const token = randomToken();
    oneTimeTokens.set(token, {
      token,
      userId: user.id,
      purpose: 'email_verification',
      expiresAt: Date.now() + VERIFY_TTL_MS,
    });
    logEmail(user.email, 'Verify your account', buildLink('/verify', token));
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    await delay(jitter());
    const user = requireUserByEmail(input.email);
    if (user?.password !== input.password) {
      throw new ApiError({
        code: 'unauthorized',
        title: 'Unauthorized',
        detail: 'Invalid email or password.',
        status: 401,
      });
    }
    if (!activeStatus(user.status)) {
      throw new ApiError({
        code: 'unauthorized',
        title: 'Unauthorized',
        detail: 'Please verify your email before signing in.',
        status: 401,
      });
    }

    const tokens = issueTokens(user.id);
    return { user: stripPassword(user), tokens };
  },

  async refresh(refreshToken: string): Promise<LoginResponse> {
    await delay(jitter());
    const existing = refreshTokens.get(refreshToken);
    if (!existing || existing.expiresAt < Date.now()) {
      throw new ApiError({
        code: 'unauthorized',
        title: 'Unauthorized',
        detail: 'Refresh token invalid or expired.',
        status: 401,
      });
    }

    refreshTokens.delete(refreshToken);
    const user = Array.from(users.values()).find((candidate) => candidate.id === existing.userId);
    if (!user) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'User no longer exists.',
        status: 404,
      });
    }

    const tokens = issueTokens(user.id);
    return { user: stripPassword(user), tokens };
  },

  async logout(refreshToken: string) {
    await delay(jitter());
    refreshTokens.delete(refreshToken);
  },

  async forgotPassword(input: ForgotPasswordInput) {
    await delay(jitter());
    const user = requireUserByEmail(input.email);
    if (!user) return;

    const token = randomToken();
    oneTimeTokens.set(token, {
      token,
      userId: user.id,
      purpose: 'password_reset',
      expiresAt: Date.now() + RESET_TTL_MS,
    });
    logEmail(user.email, 'Reset your password', buildLink('/reset', token));
  },

  async resetPassword(input: ResetPasswordInput) {
    await delay(jitter());
    const record = oneTimeTokens.get(input.token);
    if (record?.purpose !== 'password_reset' || record.expiresAt < Date.now()) {
      throw new ApiError({
        code: 'invalid_token',
        title: 'Invalid token',
        detail: 'This reset link is invalid or has expired.',
        status: 400,
      });
    }

    const user = Array.from(users.values()).find((candidate) => candidate.id === record.userId);
    if (!user) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'User no longer exists.',
        status: 404,
      });
    }

    user.password = input.new_password;
    oneTimeTokens.delete(input.token);

    for (const [key, entry] of refreshTokens.entries()) {
      if (entry.userId === user.id) refreshTokens.delete(key);
    }
  },

  async getMe(): Promise<User> {
    await delay(jitter());
    const activeRefresh = Array.from(refreshTokens.values())[0];
    if (!activeRefresh) {
      throw new ApiError({
        code: 'unauthorized',
        title: 'Unauthorized',
        detail: 'Not signed in.',
        status: 401,
      });
    }
    const user = Array.from(users.values()).find(
      (candidate) => candidate.id === activeRefresh.userId,
    );
    if (!user) {
      throw new ApiError({
        code: 'not_found',
        title: 'Not found',
        detail: 'User no longer exists.',
        status: 404,
      });
    }
    return stripPassword(user);
  },
};
