import type { ReactNode } from 'react';
import styled from 'styled-components';

import { Label } from '@/shared/components/label';

type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export const Field = ({ label, htmlFor, required, error, hint, children }: FieldProps) => {
  const messageId = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined;

  return (
    <Root>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      <Control aria-describedby={messageId}>{children}</Control>
      {error ? (
        <Error id={messageId} role="alert">
          {error}
        </Error>
      ) : hint ? (
        <Hint id={messageId}>{hint}</Hint>
      ) : null}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Control = styled.div`
  display: flex;
  flex-direction: column;
`;

const Hint = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Error = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.destructive};
`;
