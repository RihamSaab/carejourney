import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useCreateMedication } from '@/features/medications/hooks';
import {
  medicationFormSchema,
  type MedicationFormValues,
  parseHours,
} from '@/features/medications/schemas';
import { Button } from '@/shared/components/button';
import { Field } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Modal } from '@/shared/components/modal';
import { Textarea } from '@/shared/components/textarea';

type MedicationFormModalProps = {
  open: boolean;
  carePlanId: string;
  onClose: () => void;
};

const todayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const MedicationFormModal = ({ open, carePlanId, onClose }: MedicationFormModalProps) => {
  const create = useCreateMedication();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: '',
      dosage: '',
      times_per_day: 1,
      hours_text: '08:00',
      start_at: todayIso(),
      end_at: null,
      instructions: null,
    },
  });

  const submit = handleSubmit((values) => {
    const hours = parseHours(values.hours_text);
    create.mutate(
      {
        carePlanId,
        input: {
          name: values.name,
          dosage: values.dosage,
          frequency: { times_per_day: values.times_per_day, hours },
          start_at: values.start_at,
          end_at: values.end_at,
          instructions: values.instructions,
        },
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  });

  return (
    <Modal open={open} onClose={onClose} title="Add medication" size="md">
      <Form onSubmit={submit} noValidate>
        <Field label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="off"
            hasError={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field
          label="Dosage"
          htmlFor="dosage"
          required
          hint="e.g. 500mg, 2 puffs, 1 tablet"
          error={errors.dosage?.message}
        >
          <Input
            id="dosage"
            autoComplete="off"
            hasError={Boolean(errors.dosage)}
            {...register('dosage')}
          />
        </Field>

        <TwoCol>
          <SelectField>
            <Label htmlFor="times_per_day">Times per day</Label>
            <Select id="times_per_day" {...register('times_per_day')}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </SelectField>

          <Field
            label="Times (HH:MM, comma-separated)"
            htmlFor="hours_text"
            required
            hint="e.g. 08:00, 20:00"
            error={errors.hours_text?.message}
          >
            <Input
              id="hours_text"
              hasError={Boolean(errors.hours_text)}
              {...register('hours_text')}
            />
          </Field>
        </TwoCol>

        <TwoCol>
          <Field label="Start date" htmlFor="start_at" required error={errors.start_at?.message}>
            <Input
              id="start_at"
              type="date"
              hasError={Boolean(errors.start_at)}
              {...register('start_at')}
            />
          </Field>
          <Field label="End date" htmlFor="end_at" hint="Optional" error={errors.end_at?.message}>
            <Input
              id="end_at"
              type="date"
              hasError={Boolean(errors.end_at)}
              {...register('end_at')}
            />
          </Field>
        </TwoCol>

        <Field
          label="Instructions"
          htmlFor="instructions"
          hint="Optional"
          error={errors.instructions?.message}
        >
          <Textarea
            id="instructions"
            rows={3}
            hasError={Boolean(errors.instructions)}
            {...register('instructions')}
          />
        </Field>

        <Actions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add medication'}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TwoCol = styled.div`
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
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;
