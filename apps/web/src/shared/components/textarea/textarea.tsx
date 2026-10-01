import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styled from 'styled-components';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError = false, rows = 4, ...rest }, ref) => {
    return <Root ref={ref} rows={rows} $hasError={hasError} aria-invalid={hasError} {...rest} />;
  },
);

Textarea.displayName = 'Textarea';

const Root = styled.textarea<{ $hasError: boolean }>`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? theme.colors.destructive : theme.colors.input)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  resize: vertical;
  min-height: 5rem;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &::placeholder {
    color: ${({ theme }) => theme.colors.mutedForeground};
  }

  &:hover:not(:disabled) {
    border-color: ${({ theme, $hasError }) =>
      $hasError ? theme.colors.destructive : theme.colors.mutedForeground};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.muted};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
