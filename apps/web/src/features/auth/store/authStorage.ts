const REFRESH_TOKEN_KEY = 'hospital.refresh_token';

export const authStorage = {
  getRefreshToken(): string | null {
    try {
      return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken(token: string): void {
    try {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // storage may be unavailable (private mode); silently ignore
    }
  },
  clearRefreshToken(): void {
    try {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // silently ignore
    }
  },
};
