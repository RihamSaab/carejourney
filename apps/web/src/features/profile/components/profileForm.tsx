import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useUpdateProfile } from '@/features/profile/hooks';
import {
  type ProfileFormValues,
  profileSchema,
  SUPPORTED_LANGUAGES,
  SUPPORTED_TIMEZONES,
} from '@/features/profile/schemas';
import type { PatientProfile, UpdatePatientProfileInput } from '@/features/profile/types';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Field } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';

type ProfileFormProps = {
  profile: PatientProfile;
  onCancel: () => void;
  onSaved: () => void;
};

const buildDefaults = (profile: PatientProfile): ProfileFormValues => ({
  date_of_birth: profile.date_of_birth,
  phone: profile.phone,
  timezone: (SUPPORTED_TIMEZONES as readonly string[]).includes(profile.timezone)
    ? (profile.timezone as ProfileFormValues['timezone'])
    : 'UTC',
  preferred_language: profile.preferred_language === 'ar' ? 'ar' : 'en',
  emergency_contact_enabled: profile.emergency_contact !== null,
  emergency_contact: profile.emergency_contact ?? {
    name: '',
    phone: '',
    relationship: '',
  },
});

export const ProfileForm = ({ profile, onCancel, onSaved }: ProfileFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: buildDefaults(profile),
  });

  const update = useUpdateProfile();
  const emergencyEnabled = watch('emergency_contact_enabled');

  const onSubmit = handleSubmit((values) => {
    const payload: UpdatePatientProfileInput = {
      date_of_birth: values.date_of_birth,
      phone: values.phone,
      timezone: values.timezone,
      preferred_language: values.preferred_language,
      emergency_contact:
        values.emergency_contact_enabled && values.emergency_contact
          ? values.emergency_contact
          : null,
    };

    update.mutate(payload, {
      onSuccess: () => {
        onSaved();
      },
    });
  });

  return (
    <Card padding="lg">
      <Form onSubmit={onSubmit} noValidate>
        <Field
          label="Date of birth"
          htmlFor="date_of_birth"
          hint="YYYY-MM-DD"
          error={errors.date_of_birth?.message}
        >
          <Input
            id="date_of_birth"
            type="date"
            hasError={Boolean(errors.date_of_birth)}
            {...register('date_of_birth')}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+966 50 000 0000"
            hasError={Boolean(errors.phone)}
            {...register('phone')}
          />
        </Field>

        <SelectField>
          <Label htmlFor="timezone">Timezone</Label>
          <Select id="timezone" {...register('timezone')}>
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </SelectField>

        <SelectField>
          <Label htmlFor="preferred_language">Preferred language</Label>
          <Select id="preferred_language" {...register('preferred_language')}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </Select>
        </SelectField>

        <Fieldset>
          <Legend>
            <input
              id="emergency_contact_enabled"
              type="checkbox"
              {...register('emergency_contact_enabled')}
            />
            <label htmlFor="emergency_contact_enabled">Add an emergency contact</label>
          </Legend>

          {emergencyEnabled ? (
            <EmergencyGrid>
              <Field
                label="Name"
                htmlFor="emergency_name"
                error={errors.emergency_contact?.name?.message}
              >
                <Input
                  id="emergency_name"
                  hasError={Boolean(errors.emergency_contact?.name)}
                  {...register('emergency_contact.name')}
                />
              </Field>
              <Field
                label="Phone"
                htmlFor="emergency_phone"
                error={errors.emergency_contact?.phone?.message}
              >
                <Input
                  id="emergency_phone"
                  type="tel"
                  hasError={Boolean(errors.emergency_contact?.phone)}
                  {...register('emergency_contact.phone')}
                />
              </Field>
              <Field
                label="Relationship"
                htmlFor="emergency_relationship"
                error={errors.emergency_contact?.relationship?.message}
              >
                <Input
                  id="emergency_relationship"
                  placeholder="e.g. Spouse, Parent"
                  hasError={Boolean(errors.emergency_contact?.relationship)}
                  {...register('emergency_contact.relationship')}
                />
              </Field>
            </EmergencyGrid>
          ) : null}
        </Fieldset>

        <Actions>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending || !isDirty}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </Actions>
      </Form>
    </Card>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SelectField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.input};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const Fieldset = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Legend = styled.legend`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0 ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const EmergencyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;
