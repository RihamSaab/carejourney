import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import styled from 'styled-components';

import {
  AppointmentBucket,
  AppointmentDetailModal,
  AppointmentListItem,
} from '@/features/appointments/components';
import { useUpcomingAppointments } from '@/features/appointments/hooks';
import type { Appointment } from '@/features/appointments/types';
import { dayKey, formatDayLabel } from '@/features/appointments/utils/formatWhen';
import { useAuthStore } from '@/features/auth';
import { EmptyState } from '@/shared/components/emptyState';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

type DayBucket = {
  key: string;
  label: string;
  appointments: Appointment[];
};

const groupByDay = (appointments: Appointment[]): DayBucket[] => {
  const map = new Map<string, DayBucket>();
  for (const appt of appointments) {
    const key = dayKey(appt.scheduled_at);
    const existing = map.get(key);
    if (existing) {
      existing.appointments.push(appt);
    } else {
      map.set(key, {
        key,
        label: formatDayLabel(appt.scheduled_at),
        appointments: [appt],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
};

export const AppointmentsPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const query = useUpcomingAppointments();

  if (currentUser && currentUser.role !== 'patient') {
    return (
      <Page>
        <PageHeader title="Appointments" />
        <EmptyState
          icon={CalendarRange}
          title="Patients only"
          description="This page is only available for patient accounts."
        />
      </Page>
    );
  }

  if (query.isPending) {
    return (
      <Page>
        <PageHeader title="Appointments" subtitle="Your upcoming visits" />
        <PageLoading label="Loading appointments…" />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        <PageHeader title="Appointments" subtitle="Your upcoming visits" />
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const appointments = query.data;

  if (appointments.length === 0) {
    return (
      <Page>
        <PageHeader title="Appointments" subtitle="Your upcoming visits" />
        <EmptyState
          icon={CalendarRange}
          title="Nothing scheduled"
          description="You have no upcoming appointments."
        />
      </Page>
    );
  }

  const buckets = groupByDay(appointments);

  return (
    <Page>
      <PageHeader title="Appointments" subtitle="Your upcoming visits" />
      <Buckets>
        {buckets.map((bucket) => (
          <AppointmentBucket
            key={bucket.key}
            title={bucket.label}
            count={bucket.appointments.length}
          >
            {bucket.appointments.map((appt) => (
              <AppointmentListItem
                key={appt.id}
                appointment={appt}
                onOpen={setSelected}
                showCarePlanTitle
              />
            ))}
          </AppointmentBucket>
        ))}
      </Buckets>
      {selected ? (
        <AppointmentDetailModal
          open
          onClose={() => setSelected(null)}
          appointment={selected}
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

const Buckets = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;
