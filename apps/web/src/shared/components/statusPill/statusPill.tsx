import styled, { css } from 'styled-components';

import { Badge, type BadgeTone } from '@/shared/components/badge';

export type StatusPillState =
  'active' | 'pending' | 'completed' | 'cancelled' | 'overdue' | 'draft';

type StatusPillProps = {
  state: StatusPillState;
  label?: string;
};

const STATE_MAP: Record<StatusPillState, { tone: BadgeTone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  pending: { tone: 'warning', label: 'Pending' },
  completed: { tone: 'primary', label: 'Completed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  overdue: { tone: 'destructive', label: 'Overdue' },
  draft: { tone: 'neutral', label: 'Draft' },
};

const DOT_COLOR: Record<StatusPillState, string> = {
  active: 'hsl(152, 69%, 31%)',
  pending: 'hsl(38, 92%, 50%)',
  completed: 'hsl(199, 89%, 40%)',
  cancelled: 'hsl(215, 16%, 47%)',
  overdue: 'hsl(0, 72%, 51%)',
  draft: 'hsl(215, 16%, 47%)',
};

export const StatusPill = ({ state, label }: StatusPillProps) => {
  const { tone, label: defaultLabel } = STATE_MAP[state];

  return (
    <Badge tone={tone}>
      <Dot $color={DOT_COLOR[state]} />
      {label ?? defaultLabel}
    </Badge>
  );
};

const Dot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin-right: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color }) => $color};
  ${css``}
`;
