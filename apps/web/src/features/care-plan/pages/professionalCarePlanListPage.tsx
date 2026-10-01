import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import styled from 'styled-components';

import { CarePlanCard, CarePlanFormModal } from '@/features/care-plan/components';
import { useMyCarePlans } from '@/features/care-plan/hooks';
import { Button } from '@/shared/components/button';
import { EmptyState } from '@/shared/components/emptyState';
import { Icon } from '@/shared/components/icon';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

export const ProfessionalCarePlanListPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const query = useMyCarePlans();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const headerActions = (
    <Button onClick={openModal}>
      <Icon icon={Plus} size="sm" />
      New care plan
    </Button>
  );

  if (query.isPending) {
    return (
      <Page>
        <PageHeader title="Care plans" actions={headerActions} />
        <PageLoading label="Loading care plans…" />
        <CarePlanFormModal mode="create" open={isModalOpen} onClose={closeModal} />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        <PageHeader title="Care plans" actions={headerActions} />
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
        <CarePlanFormModal mode="create" open={isModalOpen} onClose={closeModal} />
      </Page>
    );
  }

  const plans = query.data;

  return (
    <Page>
      <PageHeader title="Care plans" subtitle="Plans you've created" actions={headerActions} />
      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No care plans yet"
          description="Create your first care plan for a patient."
          action={<Button onClick={openModal}>New care plan</Button>}
        />
      ) : (
        <List>
          {plans.map((plan) => (
            <CarePlanCard
              key={plan.id}
              plan={plan}
              to={`/care-plans/${plan.id}`}
              perspective="professional"
            />
          ))}
        </List>
      )}
      <CarePlanFormModal mode="create" open={isModalOpen} onClose={closeModal} />
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
