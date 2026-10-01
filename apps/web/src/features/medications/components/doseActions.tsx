import { Check, Clock, X } from 'lucide-react';
import styled from 'styled-components';

import { useUpdateMedicationEvent } from '@/features/medications/hooks';
import type { MedicationEvent, UpdateMedicationEventInput } from '@/features/medications/types';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';

type DoseActionsProps = {
  event: MedicationEvent;
};

export const DoseActions = ({ event }: DoseActionsProps) => {
  const mutation = useUpdateMedicationEvent();
  const disabled = mutation.isPending || event.state !== 'scheduled';

  const trigger = (state: UpdateMedicationEventInput['state']) => {
    mutation.mutate({ eventId: event.id, input: { state } });
  };

  return (
    <Row>
      <ActionButton
        type="button"
        variant="primary"
        size="sm"
        disabled={disabled}
        onClick={() => trigger('taken')}
      >
        <Icon icon={Check} size="sm" />
        Taken
      </ActionButton>
      <ActionButton
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => trigger('skipped')}
      >
        <Icon icon={X} size="sm" />
        Skipped
      </ActionButton>
      <ActionButton
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => trigger('snoozed')}
      >
        <Icon icon={Clock} size="sm" />
        Snooze
      </ActionButton>
    </Row>
  );
};

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

const ActionButton = styled(Button)`
  flex: 1;
  min-width: 6rem;
`;
