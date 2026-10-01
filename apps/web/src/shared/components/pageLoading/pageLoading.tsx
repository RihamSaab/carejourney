import { Loader2 } from 'lucide-react';
import styled from 'styled-components';

import { Icon } from '@/shared/components/icon';

type PageLoadingProps = {
  label?: string;
};

export const PageLoading = ({ label = 'Loading…' }: PageLoadingProps) => {
  return (
    <Root role="status" aria-live="polite">
      <Spinner>
        <Icon icon={Loader2} size="lg" />
      </Spinner>
      <Label>{label}</Label>
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Spinner = styled.div`
  color: ${({ theme }) => theme.colors.primary};

  svg {
    animation: page-loading-spin 1s linear infinite;
  }

  @keyframes page-loading-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Label = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;
