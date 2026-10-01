import { useState } from 'react';
import { Pencil, UserX } from 'lucide-react';
import styled from 'styled-components';

import { useAuthStore } from '@/features/auth';
import { ProfileForm, ProfileView } from '@/features/profile/components';
import { useProfile } from '@/features/profile/hooks';
import { Button } from '@/shared/components/button';
import { EmptyState } from '@/shared/components/emptyState';
import { Icon } from '@/shared/components/icon';
import { PageError } from '@/shared/components/pageError';
import { PageHeader } from '@/shared/components/pageHeader';
import { PageLoading } from '@/shared/components/pageLoading';

export const ProfilePage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const profileQuery = useProfile();

  if (currentUser && currentUser.role !== 'patient') {
    return (
      <Page>
        <PageHeader title="Profile" />
        <EmptyState
          icon={UserX}
          title="Patient profile only"
          description="This page is only available for patient accounts. Professional and admin profiles are coming in a later section."
        />
      </Page>
    );
  }

  if (profileQuery.isPending) {
    return (
      <Page>
        <PageHeader title="Profile" />
        <PageLoading label="Loading your profile…" />
      </Page>
    );
  }

  if (profileQuery.isError) {
    return (
      <Page>
        <PageHeader title="Profile" />
        <PageError
          title="Could not load your profile"
          message={profileQuery.error.message}
          onRetry={() => void profileQuery.refetch()}
        />
      </Page>
    );
  }

  const profile = profileQuery.data;

  return (
    <Page>
      <PageHeader
        title="Profile"
        subtitle="Your account details and emergency contact"
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Icon icon={Pencil} size="sm" />
              Edit
            </Button>
          ) : null
        }
      />
      {isEditing ? (
        <ProfileForm
          profile={profile}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <ProfileView profile={profile} />
      )}
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;
