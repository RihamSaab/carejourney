import { Pill } from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { DoseGroup } from '@/features/medications/components';
import { useTodayMedicationEvents } from '@/features/medications/hooks';
import type { MedicationEvent } from '@/features/medications/types';
import { EmptyState } from '@/shared/components/emptyState';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

const formatToday = (): string => {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const groupByTime = (events: MedicationEvent[]): [string, MedicationEvent[]][] => {
  const buckets = new Map<string, MedicationEvent[]>();
  for (const event of events) {
    const key = formatTime(event.scheduled_at);
    const bucket = buckets.get(key) ?? [];
    bucket.push(event);
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries());
};

export const MedicationsPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const query = useTodayMedicationEvents();

  if (currentUser && currentUser.role !== 'patient') {
    return (
      <Page>
        <PageHeader title="Medications" />
        <EmptyState
          icon={Pill}
          title="Patients only"
          description="This page is only available for patient accounts."
        />
      </Page>
    );
  }

  if (query.isPending) {
    return (
      <Page>
        <PageHeader title="Today" subtitle={formatToday()} />
        <PageLoading label="Loading today's doses…" />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        <PageHeader title="Today" subtitle={formatToday()} />
        <PageError message={query.error.message} onRetry={() => void query.refetch()} />
      </Page>
    );
  }

  const events = query.data;
  if (events.length === 0) {
    return (
      <Page>
        <PageHeader title="Today" subtitle={formatToday()} />
        <EmptyState
          icon={Pill}
          title="Nothing due today"
          description="You have no scheduled doses for today."
        />
      </Page>
    );
  }

  const groups = groupByTime(events);

  return (
    <Page>
      <PageHeader title="Today" subtitle={formatToday()} />
      <Groups>
        {groups.map(([time, groupEvents]) => (
          <DoseGroup key={time} time={time} events={groupEvents} />
        ))}
      </Groups>
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Groups = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;
