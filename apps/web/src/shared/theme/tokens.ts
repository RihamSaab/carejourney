const colors = {
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222, 47%, 11%)',

  card: 'hsl(0, 0%, 100%)',
  cardForeground: 'hsl(222, 47%, 11%)',

  primary: 'hsl(199, 89%, 40%)',
  primaryHover: 'hsl(199, 89%, 35%)',
  primaryForeground: 'hsl(0, 0%, 100%)',

  secondary: 'hsl(210, 40%, 96%)',
  secondaryHover: 'hsl(210, 40%, 92%)',
  secondaryForeground: 'hsl(222, 47%, 11%)',

  muted: 'hsl(210, 40%, 96%)',
  mutedForeground: 'hsl(215, 16%, 47%)',

  accent: 'hsl(199, 89%, 94%)',
  accentForeground: 'hsl(199, 89%, 20%)',

  destructive: 'hsl(0, 72%, 51%)',
  destructiveHover: 'hsl(0, 72%, 45%)',
  destructiveForeground: 'hsl(0, 0%, 100%)',

  success: 'hsl(152, 69%, 31%)',
  successForeground: 'hsl(0, 0%, 100%)',

  warning: 'hsl(38, 92%, 50%)',
  warningForeground: 'hsl(0, 0%, 100%)',

  border: 'hsl(214, 32%, 91%)',
  input: 'hsl(214, 32%, 91%)',
  ring: 'hsl(199, 89%, 40%)',
} as const;

const spacing = {
  none: '0',
  xxs: '0.125rem',
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem',
} as const;

const radii = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

const shadows = {
  sm: '0 1px 2px 0 hsl(222 47% 11% / 0.05)',
  md: '0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.06)',
  lg: '0 10px 15px -3px hsl(222 47% 11% / 0.08), 0 4px 6px -4px hsl(222 47% 11% / 0.06)',
  xl: '0 20px 25px -5px hsl(222 47% 11% / 0.1), 0 8px 10px -6px hsl(222 47% 11% / 0.06)',
} as const;

const transitions = {
  fast: '150ms ease-out',
  base: '200ms ease-out',
  slow: '300ms ease-out',
} as const;

const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

const media = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;

const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  toast: 60,
  tooltip: 70,
} as const;

export const tokens = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  transitions,
  breakpoints,
  media,
  zIndex,
} as const;

export type Tokens = typeof tokens;
