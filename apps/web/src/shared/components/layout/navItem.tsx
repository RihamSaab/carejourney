import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import styled from 'styled-components';

import { Icon } from '@/shared/components/icon';

type NavItemProps = {
  to: string;
  label: string;
  icon?: LucideIcon;
};

export const NavItem = ({ to, label, icon }: NavItemProps) => {
  return (
    <Link to={to} end>
      {icon ? <Icon icon={icon} size="sm" /> : null}
      <Text>{label}</Text>
    </Link>
  );
};

const Link = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.muted};
    text-decoration: none;
  }

  &.active {
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accentForeground};
  }
`;

const Text = styled.span`
  flex: 1;
`;
