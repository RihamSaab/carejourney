import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { CarePlanDetail, CarePlanFormModal } from '@/features/care-plan/components';
import { useCarePlan } from '@/features/care-plan/hooks';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

export const CarePlanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const query = useCarePlan(id);

  const perspective = currentUser?.role === 'professional' ? 'professional' : 'patient';
  const backTo = perspective === 'professional' ? '/care-plans' : '/care-plan';
  const canEdit = perspective === 'professional' && query.data?.professional_id === currentUser?.id;

  if (query.isPending) {
    return (
      <Page>
        <BackLink to={backTo}>
          <Icon icon={ArrowLeft} size="sm" />
          Back
        </BackLink>
        <PageLoading label="Loading care plan…" />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        <BackLink to={backTo}>
          <Icon icon={ArrowLeft} size="sm" />
          Back
        </BackLink>
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const plan = query.data;

  return (
    <Page>
      <BackLink to={backTo}>
        <Icon icon={ArrowLeft} size="sm" />
        Back
      </BackLink>

      {canEdit ? (
        <PageHeader
          title="Care plan"
          actions={
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Icon icon={Pencil} size="sm" />
              Edit
            </Button>
          }
        />
      ) : null}

      <CarePlanDetail plan={plan} perspective={perspective} canEdit={canEdit} />

      {canEdit ? (
        <CarePlanFormModal
          mode="edit"
          open={isEditing}
          plan={plan}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: fit-content;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
    text-decoration: none;
  }
`;
