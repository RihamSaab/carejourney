import { LogOut } from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore, useLogout } from '@/features/auth';
import { Avatar } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';

export const Header = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useLogout();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <Root>
      <UserBlock>
        <Avatar name={currentUser.full_name} size="md" />
        <UserText>
          <UserName>{currentUser.full_name}</UserName>
          <UserEmail>{currentUser.email}</UserEmail>
        </UserText>
        <RoleBadge>
          <Badge tone="primary">{currentUser.role}</Badge>
        </RoleBadge>
      </UserBlock>

      <Actions>
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
          <Icon icon={LogOut} size="sm" />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </Actions>
    </Root>
  );
};

const Root = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
  background: ${({ theme }) => theme.colors.card};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const UserBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const UserText = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.foreground};
`;

const UserEmail = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const RoleBadge = styled.div`
  margin-left: ${({ theme }) => theme.spacing.xs};
  text-transform: capitalize;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;
