import { useState } from 'react';
import { ListTodo } from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { TaskBucket, TaskDetailModal, TaskListItem } from '@/features/tasks/components';
import { useUpcomingTasks } from '@/features/tasks/hooks';
import type { Task } from '@/features/tasks/types';
import { EmptyState } from '@/shared/components/emptyState';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

type Bucket = {
  key: 'overdue' | 'today' | 'this_week' | 'later' | 'no_due_date';
  title: string;
  tone: 'default' | 'danger';
  tasks: Task[];
};

const todayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const sevenDaysOutIso = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const bucketize = (tasks: Task[]): Bucket[] => {
  const today = todayIso();
  const weekOut = sevenDaysOutIso();

  const buckets: Bucket[] = [
    { key: 'overdue', title: 'Overdue', tone: 'danger', tasks: [] },
    { key: 'today', title: 'Today', tone: 'default', tasks: [] },
    { key: 'this_week', title: 'This week', tone: 'default', tasks: [] },
    { key: 'later', title: 'Later', tone: 'default', tasks: [] },
    { key: 'no_due_date', title: 'No due date', tone: 'default', tasks: [] },
  ];

  for (const task of tasks) {
    if (task.is_overdue) {
      buckets[0]?.tasks.push(task);
      continue;
    }
    if (!task.due_at) {
      buckets[4]?.tasks.push(task);
      continue;
    }
    if (task.due_at === today) {
      buckets[1]?.tasks.push(task);
    } else if (task.due_at > today && task.due_at <= weekOut) {
      buckets[2]?.tasks.push(task);
    } else {
      buckets[3]?.tasks.push(task);
    }
  }
  return buckets.filter((b) => b.tasks.length > 0);
};

export const TasksPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const query = useUpcomingTasks();

  if (currentUser && currentUser.role !== 'patient') {
    return (
      <Page>
        <PageHeader title="Tasks" />
        <EmptyState
          icon={ListTodo}
          title="Patients only"
          description="This page is only available for patient accounts."
        />
      </Page>
    );
  }

  if (query.isPending) {
    return (
      <Page>
        <PageHeader title="Tasks" subtitle="Your upcoming work" />
        <PageLoading label="Loading your tasks…" />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        <PageHeader title="Tasks" subtitle="Your upcoming work" />
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const tasks = query.data;

  if (tasks.length === 0) {
    return (
      <Page>
        <PageHeader title="Tasks" subtitle="Your upcoming work" />
        <EmptyState
          icon={ListTodo}
          title="Nothing to do"
          description="You have no pending tasks."
        />
      </Page>
    );
  }

  const buckets = bucketize(tasks);

  return (
    <Page>
      <PageHeader title="Tasks" subtitle="Your upcoming work" />
      <Buckets>
        {buckets.map((bucket) => (
          <TaskBucket
            key={bucket.key}
            title={bucket.title}
            count={bucket.tasks.length}
            tone={bucket.tone}
          >
            {bucket.tasks.map((task) => (
              <TaskListItem key={task.id} task={task} onOpen={setSelectedTask} showCarePlanTitle />
            ))}
          </TaskBucket>
        ))}
      </Buckets>
      {selectedTask ? (
        <TaskDetailModal open onClose={() => setSelectedTask(null)} task={selectedTask} />
      ) : null}
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Buckets = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;
