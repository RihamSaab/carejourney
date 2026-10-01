import { Calendar, FileText, type Sparkles, User, UserCog } from 'lucide-react';
import styled from 'styled-components';

import { AppointmentsSection } from '@/features/appointments';
import type { CarePlan, CarePlanStatus } from '@/features/care-plan/types';
import { MedicationsSection } from '@/features/medications';
import { TasksSection } from '@/features/tasks';
import { Card } from '@/shared/components/card';
import { Divider } from '@/shared/components/divider';
import { EmptyState } from '@/shared/components/emptyState';
import { Icon } from '@/shared/components/icon';
import { StatusPill, type StatusPillState } from '@/shared/components/statusPill';

type CarePlanDetailProps = {
  plan: CarePlan;
  perspective: 'patient' | 'professional';
  canEdit: boolean;
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

export const CarePlanDetail = ({ plan, perspective, canEdit }: CarePlanDetailProps) => {
  return (
    <Root>
      <Card padding="lg">
        <Header>
          <TitleRow>
            <Title>{plan.title}</Title>
            <StatusPill state={STATE_MAP[plan.status]} />
          </TitleRow>
          <MetaRow>
            <Meta>
              <Icon icon={Calendar} size="xs" />
              {formatDateRange(plan.start_at, plan.end_at)}
            </Meta>
            {perspective === 'patient' ? (
              <Meta>
                <Icon icon={UserCog} size="xs" />
                Created by {plan.professional_full_name}
              </Meta>
            ) : (
              <Meta>
                <Icon icon={User} size="xs" />
                Patient: {plan.patient_full_name} · {plan.patient_email}
              </Meta>
            )}
          </MetaRow>
        </Header>

        {plan.description ? (
          <>
            <Divider />
            <Description>{plan.description}</Description>
          </>
        ) : null}
      </Card>

      <Section>
        <MedicationsSection carePlanId={plan.id} canEdit={canEdit} />
      </Section>

      <Section>
        <TasksSection carePlanId={plan.id} canEdit={canEdit} />
      </Section>

      <Section>
        <AppointmentsSection carePlanId={plan.id} canEdit={canEdit} />
      </Section>

      <SectionGrid>
        <PlaceholderSection
          icon={FileText}
          title="Documents"
          description="Reports, prescriptions, and files."
          comingIn="Section 15"
        />
      </SectionGrid>
    </Root>
  );
};

type PlaceholderProps = {
  icon: typeof Sparkles;
  title: string;
  description: string;
  comingIn: string;
};

const PlaceholderSection = ({ icon, title, description, comingIn }: PlaceholderProps) => {
  return (
    <EmptyState icon={icon} title={title} description={`${description} Arrives in ${comingIn}.`} />
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Description = styled.p`
  margin-top: ${({ theme }) => theme.spacing.md};
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.foreground};
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 1fr 1fr;
  }
`;
