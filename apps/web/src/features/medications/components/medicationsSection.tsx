import { useState } from 'react';
import { Pill, Plus } from 'lucide-react';
import styled from 'styled-components';

import { useCarePlanMedications } from '@/features/medications/hooks';
import { Button } from '@/shared/components/button';
import { EmptyState } from '@/shared/components/emptyState';
import { Icon } from '@/shared/components/icon';
import { PageError } from '@/shared/components/pageError';
import { PageLoading } from '@/shared/components/pageLoading';

import { MedicationFormModal } from './medicationFormModal';
import { MedicationListItem } from './medicationListItem';

type MedicationsSectionProps = {
  carePlanId: string;
  canEdit: boolean;
};

export const MedicationsSection = ({ carePlanId, canEdit }: MedicationsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const query = useCarePlanMedications(carePlanId);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const modal = canEdit ? (
    <MedicationFormModal open={isModalOpen} carePlanId={carePlanId} onClose={closeModal} />
  ) : null;

  if (query.isPending) {
    return (
      <>
        <SectionHeader>Medications</SectionHeader>
        <PageLoading label="Loading medications…" />
        {modal}
      </>
    );
  }

  if (query.isError) {
    return (
      <>
        <SectionHeader>Medications</SectionHeader>
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
        {modal}
      </>
    );
  }

  const medications = query.data;

  if (medications.length === 0) {
    return (
      <>
        <EmptyState
          icon={Pill}
          title="No medications yet"
          description={
            canEdit
              ? 'Add the first medication for this care plan.'
              : "Your professional hasn't added medications yet."
          }
          action={
            canEdit ? (
              <Button onClick={openModal}>
                <Icon icon={Plus} size="sm" />
                Add medication
              </Button>
            ) : undefined
          }
        />
        {modal}
      </>
    );
  }

  return (
    <>
      <HeaderRow>
        <SectionHeader>Medications</SectionHeader>
        {canEdit ? (
          <Button variant="secondary" size="sm" onClick={openModal}>
            <Icon icon={Plus} size="sm" />
            Add medication
          </Button>
        ) : null}
      </HeaderRow>
      <List>
        {medications.map((medication) => (
          <MedicationListItem key={medication.id} medication={medication} />
        ))}
      </List>
      {modal}
    </>
  );
};

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionHeader = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;
