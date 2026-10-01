import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import {
  useCreateAppointment,
  useUpdateAppointment,
} from '@/features/appointments/hooks';
import {
  APPOINTMENT_LOCATION_KINDS,
  appointmentFormSchema,
  type AppointmentFormValues,
} from '@/features/appointments/schemas';
import type { Appointment, AppointmentLocationKind } from '@/features/appointments/types';
import { Button } from '@/shared/components/button';
import { Field } from '@/shared/components/field';
import { Input } from '@/shared/components/input';
import { Label } from '@/shared/components/label';
import { Modal } from '@/shared/components/modal';
import { Textarea } from '@/shared/components/textarea';

type CreateProps = {
  mode: 'create';
  open: boolean;
  carePlanId: string;
  onClose: () => void;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
};

type AppointmentFormModalProps = CreateProps | EditProps;

const LOCATION_LABEL: Record<AppointmentLocationKind, string> = {
  in_person: 'In person',
  video: 'Video call',
  phone: 'Phone',
};

const toLocalInputValue = (iso: string): string => {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

export const AppointmentFormModal = (props: AppointmentFormModalProps) => {
  if (props.mode === 'create') {
    return <CreateModal {...props} />;
  }
  return <EditModal {...props} />;
};

const CreateModal = ({ open, carePlanId, onClose }: CreateProps) => {
  const create = useCreateAppointment();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: '',
      description: null,
      scheduled_at: '',
      duration_minutes: 30,
      location_kind: 'in_person',
      location_detail: null,
    },
  });

  const submit = handleSubmit((values) => {
    create.mutate(
      {
        carePlanId,
        input: {
          title: values.title,
          description: values.description,
          scheduled_at: new Date(values.scheduled_at).toISOString(),
          duration_minutes: values.duration_minutes,
          location_kind: values.location_kind,
          location_detail: values.location_detail,
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
    <Modal open={open} onClose={onClose} title="New appointment" size="md">
      <Form onSubmit={submit} noValidate>
        <AppointmentFields register={register} errors={errors} />
        <Actions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Saving…' : 'Create'}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
};

const EditModal = ({ open, appointment, onClose }: EditProps) => {
  const update = useUpdateAppointment();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: appointment.title,
      description: appointment.description,
      scheduled_at: toLocalInputValue(appointment.scheduled_at),
      duration_minutes: appointment.duration_minutes,
      location_kind: appointment.location_kind,
      location_detail: appointment.location_detail,
    },
  });

  const submit = handleSubmit((values) => {
    update.mutate(
      {
        appointmentId: appointment.id,
        input: {
          title: values.title,
          description: values.description,
          scheduled_at: new Date(values.scheduled_at).toISOString(),
          duration_minutes: values.duration_minutes,
          location_kind: values.location_kind,
          location_detail: values.location_detail,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit appointment" size="md">
      <Form onSubmit={submit} noValidate>
        <AppointmentFields register={register} errors={errors} />
        <Actions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending || !isDirty}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
};

type FieldsProps = {
  register: ReturnType<typeof useForm<AppointmentFormValues>>['register'];
  errors: ReturnType<typeof useForm<AppointmentFormValues>>['formState']['errors'];
};

const AppointmentFields = ({ register, errors }: FieldsProps) => {
  return (
    <>
      <Field label="Title" htmlFor="title" required error={errors.title?.message}>
        <Input
          id="title"
          autoComplete="off"
          hasError={Boolean(errors.title)}
          {...register('title')}
        />
      </Field>

      <Field label="Notes" htmlFor="description" error={errors.description?.message}>
        <Textarea
          id="description"
          rows={3}
          hasError={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <TwoCol>
        <Field
          label="When"
          htmlFor="scheduled_at"
          required
          error={errors.scheduled_at?.message}
        >
          <Input
            id="scheduled_at"
            type="datetime-local"
            hasError={Boolean(errors.scheduled_at)}
            {...register('scheduled_at')}
          />
        </Field>
        <Field
          label="Duration (minutes)"
          htmlFor="duration_minutes"
          required
          error={errors.duration_minutes?.message}
        >
          <Input
            id="duration_minutes"
            type="number"
            inputMode="numeric"
            min={5}
            max={480}
            step={5}
            hasError={Boolean(errors.duration_minutes)}
            {...register('duration_minutes')}
          />
        </Field>
      </TwoCol>

      <TwoCol>
        <SelectField>
          <Label htmlFor="location_kind">Location</Label>
          <Select id="location_kind" {...register('location_kind')}>
            {APPOINTMENT_LOCATION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {LOCATION_LABEL[kind]}
              </option>
            ))}
          </Select>
        </SelectField>
        <Field
          label="Location details"
          htmlFor="location_detail"
          error={errors.location_detail?.message}
        >
          <Input
            id="location_detail"
            placeholder="Room 3, link, number…"
            hasError={Boolean(errors.location_detail)}
            {...register('location_detail')}
          />
        </Field>
      </TwoCol>
    </>
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
