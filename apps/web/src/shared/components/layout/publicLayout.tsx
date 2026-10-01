import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

export const PublicLayout = () => {
  return (
    <Root>
      <Outlet />
    </Root>
  );
};

const Root = styled.main`
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg};
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.colors.background} 0%,
    ${({ theme }) => theme.colors.accent} 100%
  );
`;
