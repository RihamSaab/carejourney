import { tokens } from './tokens';

export const lightTheme = {
  name: 'light',
  ...tokens,
} as const;

export type Theme = typeof lightTheme;
