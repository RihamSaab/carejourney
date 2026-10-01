import { Cake, Globe, Languages, type LucideIcon, Mail, Phone, UserPlus } from 'lucide-react';
import styled from 'styled-components';

import { SUPPORTED_LANGUAGES } from '@/features/profile/schemas';
import type { PatientProfile } from '@/features/profile/types';
import { Avatar } from '@/shared/components/avatar';
import { Badge } from '@/shared/components/badge';
import { Card } from '@/shared/components/card';
import { Divider } from '@/shared/components/divider';
import { Icon } from '@/shared/components/icon';

type ProfileViewProps = {
  profile: PatientProfile;
};

const formatLanguage = (code: string): string => {
  const match = SUPPORTED_LANGUAGES.find((lang) => lang.value === code);
  return match ? match.label : code;
};

export const ProfileView = ({ profile }: ProfileViewProps) => {
  const emergency = profile.emergency_contact;

  return (
    <Card padding="lg">
      <Identity>
        <Avatar name={profile.full_name} size="lg" />
        <IdentityText>
          <Name>{profile.full_name}</Name>
          <Email>
            <Icon icon={Mail} size="xs" />
            {profile.email}
          </Email>
        </IdentityText>
        <RoleBadge>
          <Badge tone="primary">{profile.role}</Badge>
        </RoleBadge>
      </Identity>

      <Divider />

      <Rows>
        <InfoRow icon={Cake} label="Date of birth" value={profile.date_of_birth} />
        <InfoRow icon={Phone} label="Phone" value={profile.phone} />
        <InfoRow icon={Globe} label="Timezone" value={profile.timezone} />
        <InfoRow
          icon={Languages}
          label="Preferred language"
          value={formatLanguage(profile.preferred_language)}
        />
      </Rows>

      <Divider />

      <EmergencyBlock>
        <EmergencyHeader>
          <Icon icon={UserPlus} size="sm" />
          <EmergencyTitle>Emergency contact</EmergencyTitle>
        </EmergencyHeader>
        {emergency ? (
          <EmergencyRows>
            <InfoRow label="Name" value={emergency.name} />
            <InfoRow label="Phone" value={emergency.phone} />
            <InfoRow label="Relationship" value={emergency.relationship} />
          </EmergencyRows>
        ) : (
          <EmergencyEmpty>Not set.</EmergencyEmpty>
        )}
      </EmergencyBlock>
    </Card>
  );
};

type InfoRowProps = {
  icon?: LucideIcon;
  label: string;
  value: string | null;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
  return (
    <Row>
      <Label>
        {icon ? <Icon icon={icon} size="sm" /> : null}
        {label}
      </Label>
      <Value $muted={value === null || value === ''}>{value ?? '—'}</Value>
    </Row>
  );
};

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IdentityText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  flex: 1;
  min-width: 0;
`;

const Name = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Email = styled.p`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RoleBadge = styled.div`
  text-transform: capitalize;
`;

const Rows = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: baseline;

  ${({ theme }) => theme.media.sm} {
    grid-template-columns: 14rem 1fr;
  }
`;

const Label = styled.dt`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Value = styled.dd<{ $muted: boolean }>`
  margin: 0;
  color: ${({ theme, $muted }) => ($muted ? theme.colors.mutedForeground : theme.colors.foreground)};
`;

const EmergencyBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const EmergencyHeader = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.foreground};
`;

const EmergencyTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const EmergencyRows = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EmergencyEmpty = styled.p`
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;
