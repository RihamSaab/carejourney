import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';

import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks';
import { TASK_PRIORITIES, taskFormSchema, type TaskFormValues } from '@/features/tasks/schemas';
import type { Task } from '@/features/tasks/types';
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
  task: Task;
  onClose: () => void;
};

type TaskFormModalProps = CreateProps | EditProps;

export const TaskFormModal = (props: TaskFormModalProps) => {
  if (props.mode === 'create') {
    return <CreateModal {...props} />;
  }
  return <EditModal {...props} />;
};

const CreateModal = ({ open, carePlanId, onClose }: CreateProps) => {
  const create = useCreateTask();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: null,
      due_at: null,
      priority: 'normal',
    },
  });

  const submit = handleSubmit((values) => {
    create.mutate(
      {
        carePlanId,
        input: {
          title: values.title,
          description: values.description,
          due_at: values.due_at,
          priority: values.priority,
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
    <Modal open={open} onClose={onClose} title="Add task" size="md">
      <Form onSubmit={submit} noValidate>
        <TaskFields register={register} errors={errors} />
        <Actions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add task'}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
};

const EditModal = ({ open, task, onClose }: EditProps) => {
  const update = useUpdateTask();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      due_at: task.due_at,
      priority: task.priority,
    },
  });

  const submit = handleSubmit((values) => {
    update.mutate(
      {
        taskId: task.id,
        input: {
          title: values.title,
          description: values.description,
          due_at: values.due_at,
          priority: values.priority,
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
    <Modal open={open} onClose={onClose} title="Edit task" size="md">
      <Form onSubmit={submit} noValidate>
        <TaskFields register={register} errors={errors} />
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
  register: ReturnType<typeof useForm<TaskFormValues>>['register'];
  errors: ReturnType<typeof useForm<TaskFormValues>>['formState']['errors'];
};

const TaskFields = ({ register, errors }: FieldsProps) => {
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

      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea
          id="description"
          rows={3}
          hasError={Boolean(errors.description)}
          {...register('description')}
        />
      </Field>

      <TwoCol>
        <Field label="Due date" htmlFor="due_at" error={errors.due_at?.message}>
          <Input
            id="due_at"
            type="date"
            hasError={Boolean(errors.due_at)}
            {...register('due_at')}
          />
        </Field>
        <SelectField>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" {...register('priority')}>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </SelectField>
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
  text-transform: capitalize;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;
