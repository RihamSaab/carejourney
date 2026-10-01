import styled from 'styled-components';

type SkeletonProps = {
  width?: string;
  height?: string;
  radius?: string;
};

export const Skeleton = ({ width = '100%', height = '1rem', radius }: SkeletonProps) => {
  return <Root $width={width} $height={height} $radius={radius} aria-hidden />;
};

const Root = styled.div<{ $width: string; $height: string; $radius?: string }>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  border-radius: ${({ theme, $radius }) => $radius ?? theme.radii.sm};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.muted} 0%,
    ${({ theme }) => theme.colors.secondary} 50%,
    ${({ theme }) => theme.colors.muted} 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;

  @keyframes skeleton-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
