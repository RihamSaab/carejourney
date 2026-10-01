import type { HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardElevation = 'none' | 'sm' | 'md' | 'lg';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
  elevation?: CardElevation;
};

export const Card = ({ padding = 'md', elevation = 'sm', ...rest }: CardProps) => {
  return <Root $padding={padding} $elevation={elevation} {...rest} />;
};

const paddingStyles: Record<CardPadding, ReturnType<typeof css>> = {
  none: css`
    padding: 0;
  `,
  sm: css`
    padding: ${({ theme }) => theme.spacing.sm};
  `,
  md: css`
    padding: ${({ theme }) => theme.spacing.lg};
  `,
  lg: css`
    padding: ${({ theme }) => theme.spacing.xl};
  `,
};

const elevationStyles: Record<CardElevation, ReturnType<typeof css>> = {
  none: css`
    box-shadow: none;
  `,
  sm: css`
    box-shadow: ${({ theme }) => theme.shadows.sm};
  `,
  md: css`
    box-shadow: ${({ theme }) => theme.shadows.md};
  `,
  lg: css`
    box-shadow: ${({ theme }) => theme.shadows.lg};
  `,
};

type RootProps = {
  $padding: CardPadding;
  $elevation: CardElevation;
};

const Root = styled.div<RootProps>`
  background: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.cardForeground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};

  ${({ $padding }) => paddingStyles[$padding]}
  ${({ $elevation }) => elevationStyles[$elevation]}
`;
