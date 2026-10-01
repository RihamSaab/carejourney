import type { ReactNode } from 'react';
import styled from 'styled-components';

type TaskBucketProps = {
  title: string;
  count: number;
  tone?: 'default' | 'danger';
  children: ReactNode;
};

export const TaskBucket = ({ title, count, tone = 'default', children }: TaskBucketProps) => {
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

const Title = styled.h2<{ $tone: 'default' | 'danger' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.colors.destructive : theme.colors.foreground};
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
