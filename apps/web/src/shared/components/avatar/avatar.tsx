import styled, { css } from 'styled-components';

export type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name: string;
  size?: AvatarSize;
};

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return (words[0]?.[0] ?? '?').toUpperCase();
  const first = words[0]?.[0] ?? '';
  const last = words[words.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
};

export const Avatar = ({ name, size = 'md' }: AvatarProps) => {
  return (
    <Root $size={size} aria-label={name} role="img">
      {getInitials(name)}
    </Root>
  );
};

const sizeStyles: Record<AvatarSize, ReturnType<typeof css>> = {
  sm: css`
    width: 2rem;
    height: 2rem;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  `,
  md: css`
    width: 2.5rem;
    height: 2.5rem;
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  `,
  lg: css`
    width: 3rem;
    height: 3rem;
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  `,
};

const Root = styled.div<{ $size: AvatarSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  user-select: none;

  ${({ $size }) => sizeStyles[$size]}
`;
