import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useLogin } from '@/features/auth/hooks';
import { type LoginFormValues, loginSchema } from '@/features/auth/schemas';
import { ApiError } from '@/shared/api';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Field } from '@/shared/components/field';
import { FormError } from '@/shared/components/formError';
import { Input } from '@/shared/components/input';
import { toast } from '@/shared/components/toaster';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin();

  const submissionError = login.error
    ? login.error instanceof ApiError
      ? login.error.detail
      : 'Could not sign in.'
    : null;

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Signed in');
        void navigate(nextPath, { replace: true });
      },
      onError: (error) => {
        const message = error instanceof ApiError ? error.detail : 'Could not sign in';
        toast.error(message);
      },
    });
  });

  return (
    <FormCard padding="lg">
      <Header>
        <Title>Sign in</Title>
        <Subtitle>Access your care journey</Subtitle>
      </Header>

      <Form onSubmit={onSubmit} noValidate>
        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>

        {submissionError ? <FormError message={submissionError} /> : null}

        <Button type="submit" size="lg" isFullWidth disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </Form>

      <Links>
        <StyledLink to="/forgot">Forgot your password?</StyledLink>
        <Divider />
        <p>
          Don&apos;t have an account? <StyledLink to="/register">Create one</StyledLink>
        </p>
      </Links>
    </FormCard>
  );
};

const FormCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 24rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Links = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
`;

const Divider = styled.hr`
  width: 100%;
  height: 1px;
  border: none;
  background: ${({ theme }) => theme.colors.border};
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;
