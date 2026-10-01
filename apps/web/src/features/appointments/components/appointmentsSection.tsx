import { useState } from 'react';
import { CalendarPlus, CalendarRange } from 'lucide-react';
import styled from 'styled-components';

import { useCarePlanAppointments } from '@/features/appointments/hooks';
import type { Appointment } from '@/features/appointments/types';
import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/button';
import { EmptyState } from '@/shared/components/emptyState';
import { Icon } from '@/shared/components/icon';
import { PageError } from '@/shared/components/pageError';
import { PageLoading } from '@/shared/components/pageLoading';

import { AppointmentDetailModal } from './appointmentDetailModal';
import { AppointmentFormModal } from './appointmentFormModal';
import { AppointmentListItem } from './appointmentListItem';

type AppointmentsSectionProps = {
  carePlanId: string;
  canEdit: boolean;
};

export const AppointmentsSection = ({ carePlanId, canEdit }: AppointmentsSectionProps) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const query = useCarePlanAppointments(carePlanId);

  const canSchedule = canEdit || currentUser?.role === 'patient';

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);
  const openDetail = (appt: Appointment) => setSelected(appt);
  const closeDetail = () => setSelected(null);

  const modals = (
    <>
      {canSchedule ? (
        <AppointmentFormModal
          mode="create"
          open={isFormOpen}
          carePlanId={carePlanId}
          onClose={closeForm}
        />
      ) : null}
      {selected ? (
        <AppointmentDetailModal open onClose={closeDetail} appointment={selected} />
      ) : null}
    </>
  );

  if (query.isPending) {
    return (
      <>
        <SectionHeader>Appointments</SectionHeader>
        <PageLoading label="Loading appointments…" />
        {modals}
      </>
    );
  }

  if (query.isError) {
    return (
      <>
        <SectionHeader>Appointments</SectionHeader>
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
        {modals}
      </>
    );
  }

  const appointments = query.data;

  if (appointments.length === 0) {
    return (
      <>
        <EmptyState
          icon={CalendarRange}
          title="No appointments yet"
          description={
            canEdit
              ? 'Schedule the first appointment for this care plan.'
              : currentUser?.role === 'patient'
                ? 'Request an appointment to get started.'
                : "Your professional hasn't scheduled any appointments."
          }
          action={
            canSchedule ? (
              <Button onClick={openForm}>
                <Icon icon={CalendarPlus} size="sm" />
                {canEdit ? 'Schedule appointment' : 'Request appointment'}
              </Button>
            ) : undefined
          }
        />
        {modals}
      </>
    );
  }

  return (
    <>
      <HeaderRow>
        <SectionHeader>Appointments</SectionHeader>
        {canSchedule ? (
          <Button variant="secondary" size="sm" onClick={openForm}>
            <Icon icon={CalendarPlus} size="sm" />
            {canEdit ? 'Schedule' : 'Request'}
          </Button>
        ) : null}
      </HeaderRow>
      <List>
        {appointments.map((appt) => (
          <AppointmentListItem key={appt.id} appointment={appt} onOpen={openDetail} />
        ))}
      </List>
      {modals}
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
