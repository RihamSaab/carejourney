import { AlertCircle } from 'lucide-react';
import styled from 'styled-components';

import { Icon } from '@/shared/components/icon';

type FormErrorProps = {
  message: string;
};

export const FormError = ({ message }: FormErrorProps) => {
  return (
    <Root role="alert" aria-live="assertive">
      <Icon icon={AlertCircle} size="sm" />
      <span>{message}</span>
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid hsl(0, 72%, 85%);
  border-radius: ${({ theme }) => theme.radii.md};
  background: hsl(0, 72%, 97%);
  color: ${({ theme }) => theme.colors.destructive};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;
