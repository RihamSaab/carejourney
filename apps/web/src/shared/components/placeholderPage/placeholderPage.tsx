import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import styled from 'styled-components';

import { EmptyState } from '@/shared/components/emptyState';
import { PageHeader } from '@/shared/components/pageHeader';

type PlaceholderPageProps = {
  title: string;
  description?: string;
  comingIn?: string;
  children?: ReactNode;
};

export const PlaceholderPage = ({
  title,
  description,
  comingIn,
  children,
}: PlaceholderPageProps) => {
  return (
    <Root>
      <PageHeader title={title} subtitle={description} />
      <EmptyState
        icon={Sparkles}
        title="Nothing here yet"
        description={comingIn ? `Arrives in ${comingIn}.` : undefined}
      />
      {children}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;
