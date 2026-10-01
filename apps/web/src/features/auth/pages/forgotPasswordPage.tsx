import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useForgotPassword } from '@/features/auth/hooks';
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '@/features/auth/schemas';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Field } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { toast } from '@/shared/components/toaster';

export const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const forgot = useForgotPassword();

  const onSubmit = handleSubmit((values) => {
    forgot.mutate(values, {
      onSuccess: () => {
        toast.success('If that email exists, we sent a reset link.', {
          description: 'The mock link is printed to the browser console.',
        });
        reset();
      },
      onError: () => {
        toast.success('If that email exists, we sent a reset link.');
      },
    });
  });

  return (
    <FormCard padding="lg">
      <Header>
        <Title>Reset your password</Title>
        <Subtitle>We&apos;ll email you a link to set a new one.</Subtitle>
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

        <Button type="submit" size="lg" isFullWidth disabled={forgot.isPending}>
          {forgot.isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </Form>

      <Footer>
        Remembered it? <StyledLink to="/login">Back to sign in</StyledLink>
      </Footer>
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

const Footer = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;
