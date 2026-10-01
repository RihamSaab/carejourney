import type { ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import styled from 'styled-components';

type ErrorBoundaryProps = {
  children: ReactNode;
};

export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  return (
    <ReactErrorBoundary FallbackComponent={Fallback} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
};

const Fallback = ({ error }: FallbackProps) => {
  return (
    <Container role="alert" aria-live="assertive">
      <Title>Something went wrong</Title>
      <Message>
        The application ran into an unexpected error. Please reload the page. If the problem
        persists, contact support.
      </Message>
      {import.meta.env.DEV && error instanceof Error ? <Details>{error.message}</Details> : null}
    </Container>
  );
};

const handleError = (error: Error, info: ErrorInfo) => {
  console.error('Unhandled error caught by ErrorBoundary:', error, info);
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.foreground};
`;

const Message = styled.p`
  max-width: 32rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Details = styled.pre`
  max-width: 40rem;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.destructive};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  white-space: pre-wrap;
`;
