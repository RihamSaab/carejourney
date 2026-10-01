import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import {
  CARE_PLAN_STATUSES,
  carePlanEditSchema,
  type CarePlanEditValues,
  carePlanFormSchema,
  type CarePlanFormValues,
} from '@/features/care-plan/schemas';
import type {
  CarePlan,
  CreateCarePlanInput,
  UpdateCarePlanInput,
} from '@/features/care-plan/types';
import { Button } from '@/shared/components/button';
import { Field } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Textarea } from '@/shared/components/textarea';

type CreateProps = {
  mode: 'create';
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateCarePlanInput) => void;
};

type EditProps = {
  mode: 'edit';
  isSaving: boolean;
  plan: CarePlan;
  onCancel: () => void;
  onSubmit: (values: UpdateCarePlanInput) => void;
};

type CarePlanFormProps = CreateProps | EditProps;

export const CarePlanForm = (props: CarePlanFormProps) => {
  if (props.mode === 'create') return <CreateForm {...props} />;
  return <EditForm {...props} />;
};

const CreateForm = ({ isSaving, onCancel, onSubmit }: CreateProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CarePlanFormValues>({
    resolver: zodResolver(carePlanFormSchema),
    defaultValues: {
      patient_email: '',
      title: '',
      description: null,
      start_at: null,
      end_at: null,
      status: 'draft',
    },
  });

  const submit = handleSubmit((values) => {
    onSubmit({
      patient_email: values.patient_email,
      title: values.title,
      description: values.description,
      start_at: values.start_at,
      end_at: values.end_at,
      status: values.status,
    });
  });

  return (
    <Form onSubmit={submit} noValidate>
      <Field
        label="Patient email"
        htmlFor="patient_email"
        required
        hint="The patient must have an account."
        error={errors.patient_email?.message}
      >
        <Input
          id="patient_email"
          type="email"
          autoComplete="off"
          hasError={Boolean(errors.patient_email)}
          {...register('patient_email')}
        />
      </Field>

      <Field label="Title" htmlFor="title" required error={errors.title?.message}>
        <Input
          id="title"
          autoComplete="off"
          hasError={Boolean(errors.title)}
          {...register('title')}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea
          id="description"
          hasError={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <DatesRow>
        <Field label="Start date" htmlFor="start_at" error={errors.start_at?.message}>
          <Input
            id="start_at"
            type="date"
            hasError={Boolean(errors.start_at)}
            {...register('start_at')}
          />
        </Field>
        <Field label="End date" htmlFor="end_at" error={errors.end_at?.message}>
          <Input
            id="end_at"
            type="date"
            hasError={Boolean(errors.end_at)}
            {...register('end_at')}
          />
        </Field>
      </DatesRow>

      <SelectField>
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...register('status')}>
          {CARE_PLAN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </SelectField>

      <Actions>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Creating…' : 'Create care plan'}
        </Button>
      </Actions>
    </Form>
  );
};

const EditForm = ({ isSaving, plan, onCancel, onSubmit }: EditProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CarePlanEditValues>({
    resolver: zodResolver(carePlanEditSchema),
    defaultValues: {
      title: plan.title,
      description: plan.description,
      start_at: plan.start_at,
      end_at: plan.end_at,
      status: plan.status,
    },
  });

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title,
      description: values.description,
      start_at: values.start_at,
      end_at: values.end_at,
      status: values.status,
    });
  });

  return (
    <Form onSubmit={submit} noValidate>
      <Field label="Title" htmlFor="title" required error={errors.title?.message}>
        <Input
          id="title"
          autoComplete="off"
          hasError={Boolean(errors.title)}
          {...register('title')}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea
          id="description"
          hasError={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <DatesRow>
        <Field label="Start date" htmlFor="start_at" error={errors.start_at?.message}>
          <Input
            id="start_at"
            type="date"
            hasError={Boolean(errors.start_at)}
            {...register('start_at')}
          />
        </Field>
        <Field label="End date" htmlFor="end_at" error={errors.end_at?.message}>
          <Input
            id="end_at"
            type="date"
            hasError={Boolean(errors.end_at)}
            {...register('end_at')}
          />
        </Field>
      </DatesRow>

      <SelectField>
        <Label htmlFor="status">Status</Label>
        <Select id="status" {...register('status')}>
          {CARE_PLAN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </SelectField>

      <Actions>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !isDirty}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </Actions>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const DatesRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.sm} {
    grid-template-columns: 1fr 1fr;
  }
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
  text-transform: capitalize;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;
