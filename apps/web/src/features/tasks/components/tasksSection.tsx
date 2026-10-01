import { useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import styled from 'styled-components';

import { useCarePlanTasks } from '@/features/tasks/hooks';
import type { Task } from '@/features/tasks/types';
import { Button } from '@/shared/components/button';
import { EmptyState } from '@/shared/components/emptyState';
import { Icon } from '@/shared/components/icon';
import { PageError } from '@/shared/components/pageError';
import { PageLoading } from '@/shared/components/pageLoading';

import { TaskDetailModal } from './taskDetailModal';
import { TaskFormModal } from './taskFormModal';
import { TaskListItem } from './taskListItem';

type TasksSectionProps = {
  carePlanId: string;
  canEdit: boolean;
};

export const TasksSection = ({ carePlanId, canEdit }: TasksSectionProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const query = useCarePlanTasks(carePlanId);

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);
  const openDetail = (task: Task) => setSelectedTask(task);
  const closeDetail = () => setSelectedTask(null);

  const modals = (
    <>
      {canEdit ? (
        <TaskFormModal
          mode="create"
          open={isFormOpen}
          carePlanId={carePlanId}
          onClose={closeForm}
        />
      ) : null}
      {selectedTask ? <TaskDetailModal open onClose={closeDetail} task={selectedTask} /> : null}
    </>
  );

  if (query.isPending) {
    return (
      <>
        <SectionHeader>Tasks</SectionHeader>
        <PageLoading label="Loading tasks…" />
        {modals}
      </>
    );
  }

  if (query.isError) {
    return (
      <>
        <SectionHeader>Tasks</SectionHeader>
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
        {modals}
      </>
    );
  }

  const tasks = query.data;

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description={
            canEdit
              ? 'Add the first task for this care plan.'
              : "Your professional hasn't added tasks yet."
          }
          action={
            canEdit ? (
              <Button onClick={openForm}>
                <Icon icon={Plus} size="sm" />
                Add task
              </Button>
            ) : undefined
          }
        />
        {modals}
      </>
    );
  }

  return (
    <>
      <HeaderRow>
        <SectionHeader>Tasks</SectionHeader>
        {canEdit ? (
          <Button variant="secondary" size="sm" onClick={openForm}>
            <Icon icon={Plus} size="sm" />
            Add task
          </Button>
        ) : null}
      </HeaderRow>
      <List>
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} onOpen={openDetail} />
        ))}
      </List>
      {modals}
    </>
  );
};

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionHeader = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;
