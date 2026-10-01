import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import styled from 'styled-components';

import type { CarePlan, CarePlanStatus } from '@/features/care-plan/types';
import { Card } from '@/shared/components/card';
import { Icon } from '@/shared/components/icon';
import { StatusPill, type StatusPillState } from '@/shared/components/statusPill';

type CarePlanCardProps = {
  plan: CarePlan;
  to: string;
  perspective: 'patient' | 'professional';
};

const STATE_MAP: Record<CarePlanStatus, StatusPillState> = {
  draft: 'draft',
  active: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
};

const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start && !end) return 'No dates set';
  if (start && end) return `${start} → ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
};

export const CarePlanCard = ({ plan, to, perspective }: CarePlanCardProps) => {
  const subtitle =
    perspective === 'patient'
      ? `Created by ${plan.professional_full_name}`
      : `Patient: ${plan.patient_full_name} · ${plan.patient_email}`;

  return (
    <CardLink to={to}>
      <Card padding="md">
        <Row>
          <Main>
            <TitleRow>
              <Title>{plan.title}</Title>
              <StatusPill state={STATE_MAP[plan.status]} />
            </TitleRow>
            <Subtitle>{subtitle}</Subtitle>
            <Meta>
              <Icon icon={Calendar} size="xs" />
              {formatDateRange(plan.start_at, plan.end_at)}
            </Meta>
          </Main>
          <Chevron>
            <Icon icon={ChevronRight} size="md" />
          </Chevron>
        </Row>
      </Card>
    </CardLink>
  );
};

const CardLink = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }

  &:hover > * {
    border-color: ${({ theme }) => theme.colors.ring};
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Chevron = styled.div`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;
