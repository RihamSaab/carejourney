import { Outlet } from 'react-router-dom';
import styled from 'styled-components';

import { Header } from './header';
import { Sidebar } from './sidebar';

export const AppLayout = () => {
  return (
    <Root>
      <Sidebar />
      <Column>
        <Header />
        <Main>
          <Outlet />
        </Main>
      </Column>
    </Root>
  );
};

const Root = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.muted};
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
`;
