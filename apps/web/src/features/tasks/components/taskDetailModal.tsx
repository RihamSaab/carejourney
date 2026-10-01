import { useState } from 'react';
import { Calendar, Pencil, Play, SquareCheckBig, Undo2, X } from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { useUpdateTask } from '@/features/tasks/hooks';
import type { Task, TaskStatus } from '@/features/tasks/types';
import { Button } from '@/shared/components/button';
import { Divider } from '@/shared/components/divider';
import { Icon } from '@/shared/components/icon';
import { Modal } from '@/shared/components/modal';
import { StatusPill, type StatusPillState } from '@/shared/components/statusPill';

import { TaskFormModal } from './taskFormModal';

type TaskDetailModalProps = {
  open: boolean;
  task: Task;
  onClose: () => void;
};

const STATE_MAP: Record<TaskStatus, StatusPillState> = {
  pending: 'pending',
  in_progress: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

export const TaskDetailModal = ({ open, task, onClose }: TaskDetailModalProps) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const update = useUpdateTask();
  const [isEditing, setIsEditing] = useState(false);

  const isProfessional =
    currentUser?.role === 'professional' && currentUser.id === task.professional_id;
  const isPatient = currentUser?.role === 'patient';

  const transition = (status: TaskStatus) => {
    update.mutate({ taskId: task.id, input: { status } });
  };

  const state: StatusPillState = task.is_overdue ? 'overdue' : STATE_MAP[task.status];

  if (isEditing) {
    return (
      <TaskFormModal
        mode="edit"
        open={open}
        task={task}
        onClose={() => {
          setIsEditing(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={task.title} size="md">
      <Body>
        <StatusRow>
          <StatusPill state={state} />
          {task.due_at ? (
            <Meta>
              <Icon icon={Calendar} size="xs" />
              Due {task.due_at}
            </Meta>
          ) : (
            <Meta>No due date</Meta>
          )}
          <Meta>Priority: {task.priority}</Meta>
        </StatusRow>

        {task.description ? (
          <Description>{task.description}</Description>
        ) : (
          <NoDescription>No description.</NoDescription>
        )}

        <Divider />

        <PatientActions>
          {(isPatient || isProfessional) && task.status === 'pending' ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => transition('in_progress')}
              disabled={update.isPending}
            >
              <Icon icon={Play} size="sm" />
              Start
            </Button>
          ) : null}

          {(isPatient || isProfessional) && task.status === 'in_progress' ? (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => transition('completed')}
                disabled={update.isPending}
              >
                <Icon icon={SquareCheckBig} size="sm" />
                Mark complete
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => transition('pending')}
                disabled={update.isPending}
              >
                <Icon icon={Undo2} size="sm" />
                Move back to pending
              </Button>
            </>
          ) : null}

          {isProfessional ? (
            <>
              {task.status !== 'cancelled' ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => transition('cancelled')}
                  disabled={update.isPending}
                >
                  <Icon icon={X} size="sm" />
                  Cancel task
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => transition('pending')}
                  disabled={update.isPending}
                >
                  <Icon icon={Undo2} size="sm" />
                  Un-cancel
                </Button>
              )}
              {task.status === 'completed' ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => transition('in_progress')}
                  disabled={update.isPending}
                >
                  <Icon icon={Undo2} size="sm" />
                  Re-open
                </Button>
              ) : null}
              <Spacer />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(true)}
                disabled={update.isPending}
              >
                <Icon icon={Pencil} size="sm" />
                Edit
              </Button>
            </>
          ) : null}
        </PatientActions>
      </Body>
    </Modal>
  );
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-transform: capitalize;
`;

const Description = styled.p`
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.foreground};
`;

const NoDescription = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-style: italic;
`;

const PatientActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Spacer = styled.div`
  flex: 1;
`;
