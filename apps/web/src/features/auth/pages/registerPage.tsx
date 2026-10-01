import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useRegister } from '@/features/auth/hooks';
import { type RegisterFormValues, registerSchema } from '@/features/auth/schemas';
import { ApiError } from '@/shared/api';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Field } from '@/shared/components/field';
import { FormError } from '@/shared/components/formError';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { toast } from '@/shared/components/toaster';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'patient',
    },
  });

  const registerMutation = useRegister();

  const submissionError = registerMutation.error
    ? registerMutation.error instanceof ApiError
      ? registerMutation.error.detail
      : 'Could not create account.'
    : null;

  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Check your email to verify your account', {
          description: 'The mock link is printed to the browser console.',
        });
        void navigate('/login', { replace: true });
      },
      onError: (error) => {
        const message = error instanceof ApiError ? error.detail : 'Could not create account';
        toast.error(message);
      },
    });
  });

  return (
    <FormCard padding="lg">
      <Header>
        <Title>Create account</Title>
        <Subtitle>Start organising your care journey</Subtitle>
      </Header>

      <Form onSubmit={onSubmit} noValidate>
        <Field label="Full name" htmlFor="full_name" required error={errors.full_name?.message}>
          <Input
            id="full_name"
            autoComplete="name"
            hasError={Boolean(errors.full_name)}
            {...register('full_name')}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            hasError={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 10 characters."
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>

        <RoleField>
          <Label htmlFor="role">I am registering as</Label>
          <RoleSelect id="role" {...register('role')}>
            <option value="patient">Patient</option>
            <option value="professional">Healthcare professional</option>
          </RoleSelect>
        </RoleField>

        {submissionError ? <FormError message={submissionError} /> : null}

        <Button type="submit" size="lg" isFullWidth disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </Form>

      <Footer>
        Already have an account? <StyledLink to="/login">Sign in</StyledLink>
      </Footer>
    </FormCard>
  );
};

const FormCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  max-width: 26rem;
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

const RoleField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const RoleSelect = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.input};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const Footer = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;
