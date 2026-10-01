import { ClipboardList } from 'lucide-react';
import styled from 'styled-components';

import { CarePlanCard } from '@/features/care-plan/components';
import { useMyCarePlans } from '@/features/care-plan/hooks';
import { EmptyState } from '@/shared/components/emptyState';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

export const PatientCarePlanListPage = () => {
  const query = useMyCarePlans();

  if (query.isPending) {
    return (
      <Page>
        <PageHeader title="Care plan" />
        <PageLoading label="Loading your care plans…" />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        <PageHeader title="Care plan" />
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const plans = query.data;

  return (
    <Page>
      <PageHeader title="Care plan" subtitle="Plans assigned to you" />
      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No care plan yet"
          description="When your healthcare professional creates one for you, it will show up here."
        />
      ) : (
        <List>
          {plans.map((plan) => (
            <CarePlanCard
              key={plan.id}
              plan={plan}
              to={`/care-plan/${plan.id}`}
              perspective="patient"
            />
          ))}
        </List>
      )}
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;
