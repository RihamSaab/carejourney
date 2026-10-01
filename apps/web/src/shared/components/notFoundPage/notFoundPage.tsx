import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import styled from 'styled-components';

import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';

export const NotFoundPage = () => {
  return (
    <Root>
      <IconWrap>
        <Icon icon={Compass} size="xl" />
      </IconWrap>
      <Code>404</Code>
      <Title>Page not found</Title>
      <Message>The page you are looking for does not exist.</Message>
      <StyledLink to="/">
        <Button size="lg">Back to home</Button>
      </StyledLink>
    </Root>
  );
};

const Root = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const IconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
`;

const Code = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Message = styled.p`
  max-width: 32rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const StyledLink = styled(Link)`
  margin-top: ${({ theme }) => theme.spacing.md};

  &:hover {
    text-decoration: none;
  }
`;
