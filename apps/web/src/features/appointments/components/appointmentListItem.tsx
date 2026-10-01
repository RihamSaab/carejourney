import { CalendarClock, MapPin, Phone, Video } from 'lucide-react';
import styled from 'styled-components';

import type {
  Appointment,
  AppointmentLocationKind,
  AppointmentStatus,
} from '@/features/appointments/types';
import { formatWhen } from '@/features/appointments/utils/formatWhen';
import { Card } from '@/shared/components/card';
import { Icon } from '@/shared/components/icon';
import { StatusPill, type StatusPillState } from '@/shared/components/statusPill';

type AppointmentListItemProps = {
  appointment: Appointment;
  onOpen: (appointment: Appointment) => void;
  showCarePlanTitle?: boolean;
};

const STATE_MAP: Record<AppointmentStatus, { state: StatusPillState; label: string }> = {
  requested: { state: 'pending', label: 'Requested' },
  scheduled: { state: 'active', label: 'Scheduled' },
  completed: { state: 'completed', label: 'Completed' },
  cancelled: { state: 'cancelled', label: 'Cancelled' },
  no_show: { state: 'overdue', label: 'No-show' },
};

const LOCATION_ICON: Record<AppointmentLocationKind, typeof MapPin> = {
  in_person: MapPin,
  video: Video,
  phone: Phone,
};

const LOCATION_LABEL: Record<AppointmentLocationKind, string> = {
  in_person: 'In person',
  video: 'Video call',
  phone: 'Phone',
};

export const AppointmentListItem = ({
  appointment,
  onOpen,
  showCarePlanTitle = false,
}: AppointmentListItemProps) => {
  const map = STATE_MAP[appointment.status];
  const LocationIcon = LOCATION_ICON[appointment.location_kind];
  const locationText = appointment.location_detail
    ? `${LOCATION_LABEL[appointment.location_kind]} · ${appointment.location_detail}`
    : LOCATION_LABEL[appointment.location_kind];

  return (
    <ClickCard
      type="button"
      onClick={() => onOpen(appointment)}
      aria-label={`Open appointment ${appointment.title}`}
    >
      <Card padding="md">
        <Row>
          <Main>
            <TitleRow>
              <Title>{appointment.title}</Title>
              <StatusPill state={map.state} label={map.label} />
            </TitleRow>
            {showCarePlanTitle ? <Context>{appointment.care_plan_title}</Context> : null}
            <Meta>
              <Icon icon={CalendarClock} size="xs" />
              {formatWhen(appointment.scheduled_at)} · {appointment.duration_minutes} min
            </Meta>
            <Meta>
              <Icon icon={LocationIcon} size="xs" />
              {locationText}
            </Meta>
          </Main>
        </Row>
      </Card>
    </ClickCard>
  );
};

const ClickCard = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;

  &:hover > * {
    border-color: ${({ theme }) => theme.colors.ring};
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible > * {
    outline: 2px solid ${({ theme }) => theme.colors.ring};
    outline-offset: 2px;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  flex: 1;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const Title = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.foreground};
`;

const Context = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;
