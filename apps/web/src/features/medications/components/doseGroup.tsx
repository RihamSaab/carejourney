import styled from 'styled-components';

import type { MedicationEvent, MedicationEventState } from '@/features/medications/types';
import { Badge } from '@/shared/components/badge';
import { Card } from '@/shared/components/card';

import { DoseActions } from './doseActions';

type DoseGroupProps = {
  time: string;
  events: MedicationEvent[];
};

const STATE_LABEL: Record<MedicationEventState, string> = {
  scheduled: 'Due',
  taken: 'Taken',
  skipped: 'Skipped',
  snoozed: 'Snoozed',
};

const STATE_TONE: Record<MedicationEventState, 'neutral' | 'primary' | 'success' | 'warning'> = {
  scheduled: 'warning',
  taken: 'success',
  skipped: 'neutral',
  snoozed: 'primary',
};

export const DoseGroup = ({ time, events }: DoseGroupProps) => {
  return (
    <Group>
      <TimeLabel>{time}</TimeLabel>
      <List>
        {events.map((event) => (
          <Card key={event.id} padding="md">
            <Row>
              <Info>
                <Name>
                  {event.medication_name} <Dosage>{event.medication_dosage}</Dosage>
                </Name>
                <Badge tone={STATE_TONE[event.state]}>{STATE_LABEL[event.state]}</Badge>
              </Info>
              {event.state === 'scheduled' ? <DoseActions event={event} /> : null}
            </Row>
          </Card>
        ))}
      </List>
    </Group>
  );
};

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TimeLabel = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.foreground};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  ${({ theme }) => theme.media.sm} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Name = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Dosage = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;
