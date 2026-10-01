import { Calendar } from 'lucide-react';
import styled from 'styled-components';

import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/types';
import { Card } from '@/shared/components/card';
import { Icon } from '@/shared/components/icon';
import { StatusPill, type StatusPillState } from '@/shared/components/statusPill';

type TaskListItemProps = {
  task: Task;
  onOpen: (task: Task) => void;
  showCarePlanTitle?: boolean;
};

const STATE_MAP: Record<TaskStatus, StatusPillState> = {
  pending: 'pending',
  in_progress: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'hsl(215 16% 47%)',
  normal: 'hsl(199 89% 40%)',
  high: 'hsl(0 72% 51%)',
};

export const TaskListItem = ({ task, onOpen, showCarePlanTitle = false }: TaskListItemProps) => {
  const state: StatusPillState = task.is_overdue ? 'overdue' : STATE_MAP[task.status];

  return (
    <ClickCard type="button" onClick={() => onOpen(task)} aria-label={`Open task ${task.title}`}>
      <Card padding="md">
        <Row>
          <Priority title={`${task.priority} priority`} $color={PRIORITY_COLOR[task.priority]} />
          <Main>
            <TitleRow>
              <Title>{task.title}</Title>
              <StatusPill state={state} />
            </TitleRow>
            {showCarePlanTitle ? <Context>{task.care_plan_title}</Context> : null}
            {task.due_at ? (
              <Meta>
                <Icon icon={Calendar} size="xs" />
                Due {task.due_at}
              </Meta>
            ) : (
              <Meta>No due date</Meta>
            )}
          </Main>
        </Row>
      </Card>
    </ClickCard>
  );
};

const ClickCard = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;

  &:hover > * {
    border-color: ${({ theme }) => theme.colors.ring};
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible > * {
    outline: 2px solid ${({ theme }) => theme.colors.ring};
    outline-offset: 2px;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Priority = styled.span<{ $color: string }>`
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Title = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.foreground};
`;

const Context = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;
