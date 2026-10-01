import type { ReactNode } from 'react';
import styled from 'styled-components';

type AppointmentBucketProps = {
  title: string;
  count: number;
  tone?: 'default' | 'muted';
  children: ReactNode;
};

export const AppointmentBucket = ({
  title,
  count,
  tone = 'default',
  children,
}: AppointmentBucketProps) => {
  return (
    <Bucket>
      <Header>
        <Title $tone={tone}>{title}</Title>
        <Count>{count}</Count>
      </Header>
      <List>{children}</List>
    </Bucket>
  );
};

const Bucket = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h2<{ $tone: 'default' | 'muted' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme, $tone }) =>
    $tone === 'muted' ? theme.colors.mutedForeground : theme.colors.foreground};
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;
