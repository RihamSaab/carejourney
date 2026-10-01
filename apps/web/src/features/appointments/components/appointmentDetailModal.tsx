import { useState } from 'react';
import {
  CalendarCheck2,
  CalendarClock,
  CalendarX,
  Check,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Undo2,
  Video,
  X,
} from 'lucide-react';
import styled from 'styled-components';

import { useUpdateAppointment } from '@/features/appointments/hooks';
import type {
  Appointment,
  AppointmentLocationKind,
  AppointmentStatus,
} from '@/features/appointments/types';
import { formatWhen } from '@/features/appointments/utils/formatWhen';
import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/button';
import { Divider } from '@/shared/components/divider';
import { Icon } from '@/shared/components/icon';
import { Modal } from '@/shared/components/modal';
import { StatusPill, type StatusPillState } from '@/shared/components/statusPill';

import { AppointmentFormModal } from './appointmentFormModal';

type AppointmentDetailModalProps = {
  open: boolean;
  appointment: Appointment;
  onClose: () => void;
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

export const AppointmentDetailModal = ({
  open,
  appointment,
  onClose,
}: AppointmentDetailModalProps) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const update = useUpdateAppointment();
  const [isEditing, setIsEditing] = useState(false);

  const isProfessional =
    currentUser?.role === 'professional' && currentUser.id === appointment.professional_id;
  const isPatient = currentUser?.role === 'patient';

  const transition = (status: AppointmentStatus) => {
    update.mutate({ appointmentId: appointment.id, input: { status } });
  };

  const map = STATE_MAP[appointment.status];
  const LocationIcon = LOCATION_ICON[appointment.location_kind];

  if (isEditing) {
    return (
      <AppointmentFormModal
        mode="edit"
        open={open}
        appointment={appointment}
        onClose={() => {
          setIsEditing(false);
          onClose();
        }}
      />
    );
  }

  const canPatientCancel =
    isPatient && (appointment.status === 'requested' || appointment.status === 'scheduled');

  return (
    <Modal open={open} onClose={onClose} title={appointment.title} size="md">
      <Body>
        <StatusRow>
          <StatusPill state={map.state} label={map.label} />
          <Meta>
            <Icon icon={CalendarClock} size="xs" />
            {formatWhen(appointment.scheduled_at)} · {appointment.duration_minutes} min
          </Meta>
          <Meta>
            <Icon icon={LocationIcon} size="xs" />
            {LOCATION_LABEL[appointment.location_kind]}
            {appointment.location_detail ? ` · ${appointment.location_detail}` : ''}
          </Meta>
        </StatusRow>

        {appointment.description ? (
          <Description>{appointment.description}</Description>
        ) : (
          <NoDescription>No notes.</NoDescription>
        )}

        <Divider />

        <Actions>
          {isProfessional && appointment.status === 'requested' ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => transition('scheduled')}
              disabled={update.isPending}
            >
              <Icon icon={Check} size="sm" />
              Confirm
            </Button>
          ) : null}

          {isProfessional && appointment.status === 'scheduled' ? (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => transition('completed')}
                disabled={update.isPending}
              >
                <Icon icon={CalendarCheck2} size="sm" />
                Mark completed
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => transition('no_show')}
                disabled={update.isPending}
              >
                <Icon icon={CalendarX} size="sm" />
                No-show
              </Button>
            </>
          ) : null}

          {isProfessional && appointment.status === 'completed' ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => transition('scheduled')}
              disabled={update.isPending}
            >
              <Icon icon={Undo2} size="sm" />
              Re-open
            </Button>
          ) : null}

          {isProfessional && appointment.status === 'no_show' ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => transition('scheduled')}
              disabled={update.isPending}
            >
              <Icon icon={Undo2} size="sm" />
              Reschedule
            </Button>
          ) : null}

          {isProfessional && appointment.status === 'cancelled' ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => transition('scheduled')}
              disabled={update.isPending}
            >
              <Icon icon={RotateCcw} size="sm" />
              Restore
            </Button>
          ) : null}

          {canPatientCancel ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => transition('cancelled')}
              disabled={update.isPending}
            >
              <Icon icon={X} size="sm" />
              Cancel appointment
            </Button>
          ) : null}

          {isProfessional &&
          appointment.status !== 'cancelled' &&
          appointment.status !== 'completed' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => transition('cancelled')}
              disabled={update.isPending}
            >
              <Icon icon={X} size="sm" />
              Cancel
            </Button>
          ) : null}

          {isProfessional ? (
            <>
              <Spacer />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditing(true)}
                disabled={update.isPending}
              >
                <Icon icon={Pencil} size="sm" />
                Edit
              </Button>
            </>
          ) : null}
        </Actions>
      </Body>
    </Modal>
  );
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Meta = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Description = styled.p`
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.foreground};
`;

const NoDescription = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-style: italic;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Spacer = styled.div`
  flex: 1;
`;
