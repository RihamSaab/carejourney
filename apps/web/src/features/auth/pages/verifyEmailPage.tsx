import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { useVerifyEmail } from '@/features/auth/hooks';
import { ApiError } from '@/shared/api';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verify = useVerifyEmail();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!token || attemptedRef.current) return;
    attemptedRef.current = true;
    verify.mutate(token);
  }, [token, verify]);

  if (!token) {
    return (
      <FormCard padding="lg">
        <Title>Verification link missing</Title>
        <Message>The link you followed is missing a token.</Message>
        <Link to="/login">
          <Button size="lg">Back to sign in</Button>
        </Link>
      </FormCard>
    );
  }

  if (verify.isPending || verify.isIdle) {
    return (
      <FormCard padding="lg">
        <Title>Verifying your account…</Title>
        <Message>This should only take a moment.</Message>
      </FormCard>
    );
  }

  if (verify.isError) {
    const message =
      verify.error instanceof ApiError ? verify.error.detail : 'Something went wrong.';
    return (
      <FormCard padding="lg">
        <Title>Could not verify</Title>
        <Message>{message}</Message>
        <Link to="/login">
          <Button size="lg">Back to sign in</Button>
        </Link>
      </FormCard>
    );
  }

  return (
    <FormCard padding="lg">
      <Title>Account verified</Title>
      <Message>Your email is confirmed. You can now sign in.</Message>
      <Link to="/login">
        <Button size="lg">Sign in</Button>
      </Link>
    </FormCard>
  );
};

const FormCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 24rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;
