import { AlertCircle } from 'lucide-react';
import styled from 'styled-components';

import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';

type PageErrorProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export const PageError = ({ title = 'Something went wrong', message, onRetry }: PageErrorProps) => {
  return (
    <Root role="alert" aria-live="assertive">
      <IconWrap>
        <Icon icon={AlertCircle} size="xl" />
      </IconWrap>
      <Title>{title}</Title>
      <Message>{message}</Message>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.card};
  text-align: center;
`;

const IconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: hsl(0, 72%, 94%);
  color: ${({ theme }) => theme.colors.destructive};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Title = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.foreground};
`;

const Message = styled.p`
  max-width: 32rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;
