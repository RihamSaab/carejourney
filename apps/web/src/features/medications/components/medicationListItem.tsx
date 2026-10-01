import { Clock, Pill } from 'lucide-react';
import styled from 'styled-components';

import type { Medication } from '@/features/medications/types';
import { Card } from '@/shared/components/card';
import { Icon } from '@/shared/components/icon';

type MedicationListItemProps = {
  medication: Medication;
};

const formatSchedule = (medication: Medication): string => {
  const hours = medication.frequency.hours.join(', ');
  const unit = medication.frequency.times_per_day === 1 ? 'time' : 'times';
  return `${medication.frequency.times_per_day} ${unit}/day · ${hours}`;
};

const formatRange = (start: string, end: string | null): string => {
  if (!end) return `From ${start}`;
  return `${start} → ${end}`;
};

export const MedicationListItem = ({ medication }: MedicationListItemProps) => {
  return (
    <Card padding="md">
      <Row>
        <IconWrap>
          <Icon icon={Pill} size="md" />
        </IconWrap>
        <Main>
          <Name>
            {medication.name} <Dosage>{medication.dosage}</Dosage>
          </Name>
          <Meta>
            <Icon icon={Clock} size="xs" />
            {formatSchedule(medication)}
          </Meta>
          <Meta>{formatRange(medication.start_at, medication.end_at)}</Meta>
          {medication.instructions ? <Instructions>{medication.instructions}</Instructions> : null}
        </Main>
      </Row>
    </Card>
  );
};

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-start;
`;

const IconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentForeground};
  flex-shrink: 0;
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  flex: 1;
`;

const Name = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.foreground};
`;

const Dosage = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Instructions = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding-top: ${({ theme }) => theme.spacing.xs};
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  white-space: pre-wrap;
`;
