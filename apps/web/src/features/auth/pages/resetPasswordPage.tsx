import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useResetPassword } from '@/features/auth/hooks';
import { type ResetPasswordFormValues, resetPasswordSchema } from '@/features/auth/schemas';
import { ApiError } from '@/shared/api';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Field } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { toast } from '@/shared/components/toaster';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const reset = useResetPassword();

  const onSubmit = handleSubmit((values) => {
    if (!token) return;
    reset.mutate(
      { token, new_password: values.new_password },
      {
        onSuccess: () => {
          toast.success('Password updated. Please sign in.');
          void navigate('/login', { replace: true });
        },
        onError: (error) => {
          const message =
            error instanceof ApiError ? error.detail : 'Could not reset your password.';
          toast.error(message);
        },
      },
    );
  });

  if (!token) {
    return (
      <FormCard padding="lg">
        <Title>Reset link missing</Title>
        <Message>The link you followed is missing a token.</Message>
        <Link to="/forgot">
          <Button size="lg">Request a new link</Button>
        </Link>
      </FormCard>
    );
  }

  return (
    <FormCard padding="lg">
      <Header>
        <Title>Set a new password</Title>
        <Subtitle>Choose a password you haven&apos;t used before.</Subtitle>
      </Header>

      <Form onSubmit={onSubmit} noValidate>
        <Field
          label="New password"
          htmlFor="new_password"
          required
          hint="At least 10 characters."
          error={errors.new_password?.message}
        >
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.new_password)}
            {...register('new_password')}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirm_password"
          required
          error={errors.confirm_password?.message}
        >
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            hasError={Boolean(errors.confirm_password)}
            {...register('confirm_password')}
          />
        </Field>

        <Button type="submit" size="lg" isFullWidth disabled={reset.isPending}>
          {reset.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </Form>
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

const Message = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;
