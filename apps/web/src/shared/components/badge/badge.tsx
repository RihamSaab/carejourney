import type { ReactNode } from 'react';
import styled, { css } from 'styled-components';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'destructive';

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

export const Badge = ({ tone = 'neutral', children }: BadgeProps) => {
  return <Root $tone={tone}>{children}</Root>;
};

const toneStyles: Record<BadgeTone, ReturnType<typeof css>> = {
  neutral: css`
    background: ${({ theme }) => theme.colors.muted};
    color: ${({ theme }) => theme.colors.mutedForeground};
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accentForeground};
  `,
  success: css`
    background: hsl(152, 69%, 92%);
    color: ${({ theme }) => theme.colors.success};
  `,
  warning: css`
    background: hsl(38, 92%, 92%);
    color: hsl(38, 92%, 30%);
  `,
  destructive: css`
    background: hsl(0, 72%, 94%);
    color: ${({ theme }) => theme.colors.destructive};
  `,
};

const Root = styled.span<{ $tone: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xxs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  line-height: 1;
  white-space: nowrap;

  ${({ $tone }) => toneStyles[$tone]}
`;
